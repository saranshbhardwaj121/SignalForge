from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import uuid4
from unittest.mock import patch

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.api.deps import get_session
from backend.app.core.config import get_settings
from backend.app.main import app
from backend.app.models.alert import Alert, TriggeredAlert
from backend.app.models.base import Base
from backend.app.models.market_data import MarketData
from backend.app.models.user import User
from backend.app.services.alert_evaluation_service import AlertEvaluationService


class FakeTicker:
    def __init__(
        self,
        fast_info: dict[str, object] | None = None,
        info: dict[str, object] | None = None,
        history_frame: pd.DataFrame | None = None,
    ) -> None:
        self.fast_info = fast_info or {}
        self.info = info or {}
        self._history_frame = history_frame if history_frame is not None else pd.DataFrame()

    def history(self, **_: object) -> pd.DataFrame:
        return self._history_frame


settings = get_settings()
engine = create_engine(settings.database_url)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(scope="session", autouse=True)
def prepare_schema() -> None:
    Base.metadata.create_all(bind=engine)


@pytest.fixture()
def db_session() -> Session:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        try:
            db.rollback()
        except Exception:
            pass
        db.query(TriggeredAlert).delete(synchronize_session=False)
        db.query(Alert).delete(synchronize_session=False)
        db.query(MarketData).filter(MarketData.ticker.like("SFTEST%")).delete(
            synchronize_session=False
        )
        db.query(User).filter(User.username.like("sf_test_%")).delete(
            synchronize_session=False
        )
        db.query(User).filter(User.email.like("eval_test_%@example.com")).delete(
            synchronize_session=False
        )
        db.commit()
        db.close()


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    def override_get_session() -> Session:
        yield db_session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _register_and_login(client: TestClient) -> tuple[str, str, str]:
    username = f"sf_test_{uuid4().hex[:10]}"
    email = f"{username}@example.com"
    password = "SuperSecret123"
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"identifier": username, "password": password},
    )
    tokens = login_resp.json()
    return tokens["access_token"], username, email


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _seed_market_data(session: Session, ticker: str) -> None:
    rows = []
    base_price = 100.0
    for i in range(60):
        d = date(2026, 4, 1) + __import__("datetime").timedelta(days=i)
        price = base_price + (i * 0.5)
        rows.append(
            MarketData(
                ticker=ticker,
                date=d,
                open=Decimal(str(price)),
                high=Decimal(str(price + 2)),
                low=Decimal(str(price - 2)),
                close=Decimal(str(price)),
                volume=Decimal(1000000),
            )
        )
    for row in rows:
        session.add(row)
    session.commit()


# --- Price alert evaluation ---


@patch("backend.app.services.alert_evaluation_service.MarketDataService.get_quote")
def test_price_alert_triggers_when_price_above_threshold(
    mock_get_quote, db_session: Session
) -> None:
    mock_get_quote.return_value = __import__("backend.app.schemas.market_data", fromlist=["QuoteRead"]).QuoteRead(
        ticker="SFTEST.NS",
        name="Test",
        currency="INR",
        price=200.0,
        provider="yfinance",
        fetched_at=datetime.now(timezone.utc),
    )
    unique = uuid4().hex[:10]
    user = User(id=uuid4(), username=f"sf_test_{unique}", email=f"eval_test_{unique}@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()

    alert = Alert(
        user_id=user.id,
        ticker="SFTEST.NS",
        alert_type="price",
        operator="gt",
        threshold=150.0,
        status="active",
    )
    db_session.add(alert)
    db_session.commit()

    service = AlertEvaluationService(db_session)
    triggered = service.evaluate_all_active_alerts()
    assert len(triggered) == 1
    assert triggered[0].triggered_value == 200.0
    assert triggered[0].alert_id == alert.id
    assert triggered[0].operator == "gt"
    assert triggered[0].threshold == 150.0


@patch("backend.app.services.alert_evaluation_service.MarketDataService.get_quote")
def test_price_alert_does_not_trigger_when_price_below_threshold(
    mock_get_quote, db_session: Session
) -> None:
    mock_get_quote.return_value = __import__("backend.app.schemas.market_data", fromlist=["QuoteRead"]).QuoteRead(
        ticker="SFTEST.NS",
        name="Test",
        currency="INR",
        price=100.0,
        provider="yfinance",
        fetched_at=datetime.now(timezone.utc),
    )
    unique = uuid4().hex[:10]
    user = User(id=uuid4(), username=f"sf_test_{unique}", email=f"eval_test_{unique}@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()

    alert = Alert(
        user_id=user.id,
        ticker="SFTEST.NS",
        alert_type="price",
        operator="gt",
        threshold=150.0,
        status="active",
    )
    db_session.add(alert)
    db_session.commit()

    service = AlertEvaluationService(db_session)
    triggered = service.evaluate_all_active_alerts()
    assert len(triggered) == 0


@patch("backend.app.services.alert_evaluation_service.MarketDataService.get_quote")
def test_price_alert_triggers_with_lte_operator(mock_get_quote, db_session: Session) -> None:
    mock_get_quote.return_value = __import__("backend.app.schemas.market_data", fromlist=["QuoteRead"]).QuoteRead(
        ticker="SFTEST.NS",
        name="Test",
        currency="INR",
        price=100.0,
        provider="yfinance",
        fetched_at=datetime.now(timezone.utc),
    )
    unique = uuid4().hex[:10]
    user = User(id=uuid4(), username=f"sf_test_{unique}", email=f"eval_test_{unique}@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()

    alert = Alert(
        user_id=user.id,
        ticker="SFTEST.NS",
        alert_type="price",
        operator="lte",
        threshold=100.0,
        status="active",
    )
    db_session.add(alert)
    db_session.commit()

    service = AlertEvaluationService(db_session)
    triggered = service.evaluate_all_active_alerts()
    assert len(triggered) == 1


@patch("backend.app.services.alert_evaluation_service.MarketDataService.get_quote")
def test_inactive_alert_not_evaluated(mock_get_quote, db_session: Session) -> None:
    mock_get_quote.return_value = __import__("backend.app.schemas.market_data", fromlist=["QuoteRead"]).QuoteRead(
        ticker="SFTEST.NS",
        name="Test",
        currency="INR",
        price=200.0,
        provider="yfinance",
        fetched_at=datetime.now(timezone.utc),
    )
    unique = uuid4().hex[:10]
    user = User(id=uuid4(), username=f"sf_test_{unique}", email=f"eval_test_{unique}@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()

    alert = Alert(
        user_id=user.id,
        ticker="SFTEST.NS",
        alert_type="price",
        operator="gt",
        threshold=150.0,
        status="inactive",
    )
    db_session.add(alert)
    db_session.commit()

    service = AlertEvaluationService(db_session)
    triggered = service.evaluate_all_active_alerts()
    assert len(triggered) == 0


# --- Signal alert evaluation ---


@patch("backend.app.services.alert_evaluation_service.MarketDataService.get_history")
@patch("backend.app.services.alert_evaluation_service.SignalService.get_signal_summary")
def test_signal_alert_triggers(mock_get_signal, mock_get_history, db_session: Session) -> None:
    _seed_market_data(db_session, "SFTEST.NS")
    mock_get_history.return_value = __import__(
        "backend.app.schemas.market_data", fromlist=["HistoricalDataResponse"]
    ).HistoricalDataResponse(
        ticker="SFTEST.NS", period="1mo", interval="1d", rows=[], provider="yfinance", cached=False, fetched_at=datetime.now(timezone.utc)
    )
    mock_get_signal.return_value = __import__(
        "backend.app.schemas.signals", fromlist=["SignalSummaryResponse"]
    ).SignalSummaryResponse(
        ticker="SFTEST.NS",
        rating="BUY",
        score=3,
        confidence=0.75,
        period="1mo",
        interval="1d",
        parameters={},
        signals=[],
        provider="yfinance",
        cached=False,
        fetched_at=datetime.now(timezone.utc),
        generated_at=datetime.now(timezone.utc),
    )
    unique = uuid4().hex[:10]
    user = User(id=uuid4(), username=f"sf_test_{unique}", email=f"eval_test_{unique}@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()

    alert = Alert(
        user_id=user.id,
        ticker="SFTEST.NS",
        alert_type="signal",
        operator="gte",
        threshold=2,
        status="active",
    )
    db_session.add(alert)
    db_session.commit()

    service = AlertEvaluationService(db_session)
    triggered = service.evaluate_all_active_alerts()
    assert len(triggered) == 1
    assert triggered[0].triggered_value == 3.0
    assert triggered[0].snapshot["rating"] == "BUY"


@patch("backend.app.services.alert_evaluation_service.MarketDataService.get_history")
@patch("backend.app.services.alert_evaluation_service.SignalService.get_signal_summary")
def test_confidence_alert_triggers(mock_get_signal, mock_get_history, db_session: Session) -> None:
    _seed_market_data(db_session, "SFTEST.NS")
    mock_get_history.return_value = __import__(
        "backend.app.schemas.market_data", fromlist=["HistoricalDataResponse"]
    ).HistoricalDataResponse(
        ticker="SFTEST.NS", period="1mo", interval="1d", rows=[], provider="yfinance", cached=False, fetched_at=datetime.now(timezone.utc)
    )
    mock_get_signal.return_value = __import__(
        "backend.app.schemas.signals", fromlist=["SignalSummaryResponse"]
    ).SignalSummaryResponse(
        ticker="SFTEST.NS",
        rating="BUY",
        score=4,
        confidence=0.85,
        period="1mo",
        interval="1d",
        parameters={},
        signals=[],
        provider="yfinance",
        cached=False,
        fetched_at=datetime.now(timezone.utc),
        generated_at=datetime.now(timezone.utc),
    )
    unique = uuid4().hex[:10]
    user = User(id=uuid4(), username=f"sf_test_{unique}", email=f"eval_test_{unique}@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()

    alert = Alert(
        user_id=user.id,
        ticker="SFTEST.NS",
        alert_type="confidence",
        operator="gt",
        threshold=0.8,
        status="active",
    )
    db_session.add(alert)
    db_session.commit()

    service = AlertEvaluationService(db_session)
    triggered = service.evaluate_all_active_alerts()
    assert len(triggered) == 1
    assert triggered[0].triggered_value == 0.85


# --- RSI alert evaluation ---


@patch("backend.app.services.alert_evaluation_service.MarketDataService.get_history")
def test_rsi_alert_triggers(mock_get_history, db_session: Session) -> None:
    rows = []
    close_prices = []
    for i in range(20):
        close_prices.append(50.0)
    for i in range(40):
        close_prices.append(50.0 - (i * 1.5))
    for d_idx in range(60):
        d = date(2026, 4, 1) + __import__("datetime").timedelta(days=d_idx)
        c = close_prices[d_idx]
        rows.append(
            __import__("backend.app.schemas.market_data", fromlist=["HistoricalBarRead"]).HistoricalBarRead(
                date=d,
                open=c + 0.5,
                high=c + 1.0,
                low=c - 0.5,
                close=c,
                volume=1000000,
            )
        )

    mock_get_history.return_value = __import__(
        "backend.app.schemas.market_data", fromlist=["HistoricalDataResponse"]
    ).HistoricalDataResponse(
        ticker="SFTEST.NS",
        period="6mo",
        interval="1d",
        rows=rows,
        provider="yfinance",
        cached=False,
        fetched_at=datetime.now(timezone.utc),
    )

    unique = uuid4().hex[:10]
    user = User(id=uuid4(), username=f"sf_test_{unique}", email=f"eval_test_{unique}@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()

    alert = Alert(
        user_id=user.id,
        ticker="SFTEST.NS",
        alert_type="rsi",
        operator="lt",
        threshold=30,
        parameters={"rsi_window": 14},
        status="active",
    )
    db_session.add(alert)
    db_session.commit()

    service = AlertEvaluationService(db_session)
    triggered = service.evaluate_all_active_alerts()
    assert len(triggered) == 1
    assert triggered[0].triggered_value < 30
