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
from backend.app.models.base import Base
from backend.app.models.market_data import MarketData
from backend.app.models.user import User

settings = get_settings()
engine = create_engine(settings.database_url)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


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


@pytest.fixture(scope="session", autouse=True)
def prepare_schema() -> None:
    Base.metadata.create_all(bind=engine)


@pytest.fixture()
def db_session() -> Session:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.query(MarketData).filter(MarketData.ticker.like("SFTEST%")).delete(
            synchronize_session=False
        )
        db.query(User).filter(User.username.like("sf_test_%")).delete(
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


def _register_and_login(client: TestClient) -> str:
    username = f"sf_test_{uuid4().hex[:10]}"
    email = f"{username}@example.com"
    password = "SuperSecret123"
    client.post(
        "/api/v1/auth/register",
        json={"username": username, "email": email, "password": password},
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"identifier": username, "password": password},
    )
    return response.json()["access_token"]


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _history_frame(close: float = 101.0) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "Open": [100.0, 101.0],
            "High": [102.0, 103.0],
            "Low": [99.0, 100.0],
            "Close": [close, close + 1.0],
            "Volume": [1000, 2000],
        },
        index=pd.to_datetime(["2026-01-02", "2026-01-03"]),
    )


def test_quote_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/market-data/quote/SFTESTA")
    assert response.status_code == 401


def test_get_quote_success_uses_mocked_yfinance(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(
        fast_info={
            "last_price": 123.45,
            "previous_close": 120.0,
            "open": 121.0,
            "day_high": 125.0,
            "day_low": 119.5,
            "last_volume": 123456,
            "currency": "USD",
            "exchange": "NMS",
        },
        info={"shortName": "SignalForge Test Inc", "marketCap": 999999},
    )
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/market-data/quote/sftesta",
            headers=_auth_header(token),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["ticker"] == "SFTESTA"
    assert payload["price"] == 123.45
    assert payload["provider"] == "yfinance"
    assert payload["name"] == "SignalForge Test Inc"


def test_get_quote_invalid_ticker_returns_400(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/market-data/quote/AA PL",
        headers=_auth_header(token),
    )
    assert response.status_code == 400


def test_get_quote_provider_failure_returns_502(client: TestClient) -> None:
    token = _register_and_login(client)
    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        side_effect=RuntimeError("provider down"),
    ):
        response = client.get(
            "/api/v1/market-data/quote/SFTESTA",
            headers=_auth_header(token),
        )
    assert response.status_code == 502


def test_get_history_fetches_and_persists_rows(client: TestClient, db_session: Session) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame())
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/market-data/history/SFTESTA",
            headers=_auth_header(token),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["ticker"] == "SFTESTA"
    assert payload["provider"] == "yfinance"
    assert payload["cached"] is False
    assert [row["date"] for row in payload["rows"]] == ["2026-01-02", "2026-01-03"]
    assert db_session.query(MarketData).filter(MarketData.ticker == "SFTESTA").count() == 2


def test_get_history_uses_fresh_cache_without_provider_call(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame())
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        first_response = client.get(
            "/api/v1/market-data/history/SFTESTB",
            headers=_auth_header(token),
        )
    assert first_response.status_code == 200

    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        side_effect=AssertionError("provider should not be called"),
    ):
        second_response = client.get(
            "/api/v1/market-data/history/SFTESTB",
            headers=_auth_header(token),
        )

    assert second_response.status_code == 200
    assert second_response.json()["provider"] == "database"
    assert second_response.json()["cached"] is True


def test_get_history_refresh_updates_existing_rows(
    client: TestClient,
    db_session: Session,
) -> None:
    token = _register_and_login(client)
    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        return_value=FakeTicker(history_frame=_history_frame(close=101.0)),
    ):
        first_response = client.get(
            "/api/v1/market-data/history/SFTESTC",
            headers=_auth_header(token),
        )
    assert first_response.status_code == 200

    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        return_value=FakeTicker(history_frame=_history_frame(close=201.0)),
    ):
        second_response = client.get(
            "/api/v1/market-data/history/SFTESTC?refresh=true",
            headers=_auth_header(token),
        )

    assert second_response.status_code == 200
    assert second_response.json()["rows"][0]["close"] == 201.0
    assert db_session.query(MarketData).filter(MarketData.ticker == "SFTESTC").count() == 2


def test_get_history_unsupported_interval_returns_400(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/market-data/history/SFTESTD?interval=1h",
        headers=_auth_header(token),
    )
    assert response.status_code == 400


def test_get_history_empty_provider_response_returns_502(client: TestClient) -> None:
    token = _register_and_login(client)
    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        return_value=FakeTicker(history_frame=pd.DataFrame()),
    ):
        response = client.get(
            "/api/v1/market-data/history/SFTESTE",
            headers=_auth_header(token),
        )
    assert response.status_code == 502
