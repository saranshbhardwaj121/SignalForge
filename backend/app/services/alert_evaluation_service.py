from datetime import datetime, timezone
from collections import defaultdict

from sqlalchemy.orm import Session

from backend.app.models.alert import Alert, TriggeredAlert
from backend.app.repositories.alert_repository import AlertRepository, TriggeredAlertRepository
from backend.app.services.market_data_service import MarketDataService, MarketDataProviderError, MarketDataValidationError
from backend.app.services.notification_service import NotificationService
from backend.app.services.signal_service import SignalService
from backend.app.services.analytics_service import AnalyticsService


_ALERT_TYPE_OPERATORS = {
    "price": ["gt", "lt", "gte", "lte", "eq"],
    "signal": ["gt", "lt", "gte", "lte", "eq"],
    "confidence": ["gt", "lt", "gte", "lte", "eq"],
    "rsi": ["gt", "lt", "gte", "lte", "eq"],
}


def _compare(operator: str, current: float, threshold: float) -> bool:
    if operator == "gt":
        return current > threshold
    if operator == "lt":
        return current < threshold
    if operator == "gte":
        return current >= threshold
    if operator == "lte":
        return current <= threshold
    if operator == "eq":
        return abs(current - threshold) < 0.001
    return False


class AlertEvaluationService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.alert_repo = AlertRepository(session)
        self.trigger_repo = TriggeredAlertRepository(session)
        self.market_data_service = MarketDataService(session)
        self.signal_service = SignalService(session)
        self.analytics_service = AnalyticsService(session)
        self.notification_service = NotificationService(session)

    def evaluate_all_active_alerts(self) -> list[TriggeredAlert]:
        alerts = self.alert_repo.list_active()
        if not alerts:
            return []

        ticker_alerts: dict[str, list[Alert]] = defaultdict(list)
        for alert in alerts:
            ticker_alerts[alert.ticker].append(alert)

        triggered: list[TriggeredAlert] = []

        for ticker, ticker_alerts_list in ticker_alerts.items():
            try:
                triggers = self._evaluate_ticker(ticker, ticker_alerts_list)
                triggered.extend(triggers)
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(
                    "Alert evaluation failed for ticker %s: %s", ticker, exc
                )

        if triggered:
            self.session.commit()

        return triggered

    def _evaluate_ticker(self, ticker: str, alerts: list[Alert]) -> list[TriggeredAlert]:
        price = None
        signal_summary = None
        rsi_value = None
        triggered: list[TriggeredAlert] = []

        for alert in alerts:
            try:
                current_value = None
                snapshot = {"evaluated_at": datetime.now(timezone.utc).isoformat()}

                if alert.alert_type == "price":
                    if price is None:
                        quote = self.market_data_service.get_quote(ticker)
                        price = quote.price if quote else None
                        snapshot["price"] = price
                    current_value = price

                elif alert.alert_type in ("signal", "confidence"):
                    if signal_summary is None:
                        signal_summary = self.signal_service.get_signal_summary(
                            ticker,
                            period="1mo",
                            interval="1d",
                        )
                    if alert.alert_type == "signal":
                        current_value = float(signal_summary.score)
                        snapshot["score"] = signal_summary.score
                        snapshot["rating"] = signal_summary.rating
                    else:
                        current_value = signal_summary.confidence
                        snapshot["confidence"] = signal_summary.confidence
                        snapshot["rating"] = signal_summary.rating

                elif alert.alert_type == "rsi":
                    if rsi_value is None:
                        window = (alert.parameters or {}).get("rsi_window", 14)
                        history = self.market_data_service.get_history(ticker, period="6mo", interval="1d")
                        if history.rows:
                            from backend.app.services.analytics_service import AnalyticsService
                            _, rsi_latest = self.analytics_service._compute_rsi_rows(
                                history.rows, int(window)
                            )
                            rsi_value = rsi_latest.value if rsi_latest else None
                            snapshot["rsi"] = rsi_value
                    current_value = rsi_value

                if current_value is not None and _compare(alert.operator, current_value, alert.threshold):
                    record = TriggeredAlert(
                        alert_id=alert.id,
                        ticker=ticker,
                        alert_type=alert.alert_type,
                        operator=alert.operator,
                        threshold=alert.threshold,
                        triggered_value=current_value,
                        snapshot=snapshot,
                    )
                    self.trigger_repo.create(record)
                    triggered.append(record)
                    self.notification_service.create_notification(
                        user_id=alert.user_id,
                        alert_id=alert.id,
                        ticker=ticker,
                        alert_type=alert.alert_type,
                        triggered_value=current_value,
                        threshold=alert.threshold,
                        triggered_at=record.triggered_at,
                    )

            except (MarketDataProviderError, MarketDataValidationError, ValueError) as exc:
                import logging
                logging.getLogger(__name__).warning(
                    "Alert eval failed for %s on %s: %s", alert.id, ticker, exc
                )

        return triggered


def run_alert_evaluation() -> None:
    from backend.app.db.session import SessionLocal

    session = SessionLocal()
    try:
        service = AlertEvaluationService(session)
        triggered = service.evaluate_all_active_alerts()
        if triggered:
            import logging
            logging.getLogger(__name__).info("Triggered %d alerts", len(triggered))
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Alert evaluation run failed: %s", exc)
    finally:
        session.close()
