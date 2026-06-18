import pandas as pd
from sqlalchemy.orm import Session

from backend.app.schemas.analytics import IndicatorPoint, IndicatorResponse
from backend.app.schemas.market_data import HistoricalBarRead
from backend.app.services.market_data_service import (
    MarketDataProviderError,
    MarketDataService,
)


class AnalyticsService:
    MIN_WINDOW = 2
    MAX_WINDOW = 250

    def __init__(self, session: Session) -> None:
        self.session = session
        self.market_data_service = MarketDataService(session)

    def _compute_indicator_rows(
        self,
        rows: list[HistoricalBarRead],
        indicator: str,
        window: int,
    ) -> tuple[list[IndicatorPoint], IndicatorPoint | None]:
        df = pd.DataFrame(
            [{"date": r.date, "close": float(r.close)} for r in rows],
        )
        df = df.sort_values("date").reset_index(drop=True)

        if indicator == "sma":
            series = df["close"].rolling(window=window, min_periods=window).mean()
        elif indicator == "ema":
            series = df["close"].ewm(span=window, adjust=False, min_periods=window).mean()
        else:
            raise ValueError(f"Unknown indicator: {indicator}")

        indicator_rows = [
            IndicatorPoint(
                date=r["date"],
                close=float(r["close"]),
                value=float(v) if pd.notna(v) else None,
            )
            for r, v in zip(df.to_dict("records"), series)
        ]

        latest = None
        for r in reversed(indicator_rows):
            if r.value is not None:
                latest = r
                break

        return indicator_rows, latest

    def get_sma(
        self,
        ticker: str,
        window: int,
        period: str = "6mo",
        interval: str = "1d",
        refresh: bool = False,
    ) -> IndicatorResponse:
        history = self.market_data_service.get_history(ticker, period, interval, refresh)
        if not history.rows:
            raise MarketDataProviderError("No historical data available for calculation")
        rows, latest = self._compute_indicator_rows(history.rows, "sma", window)
        return IndicatorResponse(
            ticker=history.ticker,
            indicator="sma",
            period=period,
            interval=interval,
            parameters={"window": window},
            rows=rows,
            latest=latest,
            provider=history.provider,
            cached=history.cached,
            fetched_at=history.fetched_at,
        )

    def get_ema(
        self,
        ticker: str,
        window: int,
        period: str = "6mo",
        interval: str = "1d",
        refresh: bool = False,
    ) -> IndicatorResponse:
        history = self.market_data_service.get_history(ticker, period, interval, refresh)
        if not history.rows:
            raise MarketDataProviderError("No historical data available for calculation")
        rows, latest = self._compute_indicator_rows(history.rows, "ema", window)
        return IndicatorResponse(
            ticker=history.ticker,
            indicator="ema",
            period=period,
            interval=interval,
            parameters={"window": window},
            rows=rows,
            latest=latest,
            provider=history.provider,
            cached=history.cached,
            fetched_at=history.fetched_at,
        )
