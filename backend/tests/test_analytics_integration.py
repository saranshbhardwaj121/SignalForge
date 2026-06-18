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
            synchronize_session=False,
        )
        db.query(User).filter(User.username.like("sf_test_%")).delete(
            synchronize_session=False,
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


# --- Authentication ---


def test_sma_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/analytics/SFTESTA/sma")
    assert response.status_code == 401


def test_ema_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/analytics/SFTESTA/ema")
    assert response.status_code == 401


# --- Validation ---


def test_sma_invalid_ticker_returns_400(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/analytics/AA PL/sma",
        headers=_auth_header(token),
    )
    assert response.status_code == 400


def test_sma_invalid_window_too_small_returns_422(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/analytics/SFTESTA/sma?window=1",
        headers=_auth_header(token),
    )
    assert response.status_code == 422


def test_sma_invalid_window_too_large_returns_422(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/analytics/SFTESTA/sma?window=300",
        headers=_auth_header(token),
    )
    assert response.status_code == 422


def test_sma_unsupported_interval_returns_400(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/analytics/SFTESTA/sma?interval=1h",
        headers=_auth_header(token),
    )
    assert response.status_code == 400


def test_ema_invalid_ticker_returns_400(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/analytics/AA PL/ema",
        headers=_auth_header(token),
    )
    assert response.status_code == 400


def test_ema_invalid_window_returns_422(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/analytics/SFTESTA/ema?window=1",
        headers=_auth_header(token),
    )
    assert response.status_code == 422


def test_ema_unsupported_interval_returns_400(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/analytics/SFTESTA/ema?interval=1h",
        headers=_auth_header(token),
    )
    assert response.status_code == 400


# --- SMA ---


def test_sma_returns_expected_values(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame())
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/analytics/SFTESTA/sma?window=2",
            headers=_auth_header(token),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["ticker"] == "SFTESTA"
    assert payload["indicator"] == "sma"
    assert payload["parameters"] == {"window": 2}
    assert payload["provider"] == "yfinance"
    assert payload["cached"] is False

    rows = payload["rows"]
    assert len(rows) == 2
    assert rows[0]["date"] == "2026-01-02"
    assert rows[0]["close"] == 101.0
    assert rows[0]["value"] is None
    assert rows[1]["date"] == "2026-01-03"
    assert rows[1]["close"] == 102.0
    assert rows[1]["value"] == pytest.approx(101.5)


def test_sma_uses_cached_data(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame())
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        first_resp = client.get(
            "/api/v1/analytics/SFTESTB/sma?window=2",
            headers=_auth_header(token),
        )
    assert first_resp.status_code == 200
    assert first_resp.json()["provider"] == "yfinance"

    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        side_effect=AssertionError("provider should not be called"),
    ):
        second_resp = client.get(
            "/api/v1/analytics/SFTESTB/sma?window=2",
            headers=_auth_header(token),
        )
    assert second_resp.status_code == 200
    assert second_resp.json()["provider"] == "database"
    assert second_resp.json()["cached"] is True


def test_sma_provider_failure_returns_502(client: TestClient) -> None:
    token = _register_and_login(client)
    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        side_effect=RuntimeError("provider down"),
    ):
        response = client.get(
            "/api/v1/analytics/SFTESTA/sma?window=2",
            headers=_auth_header(token),
        )
    assert response.status_code == 502


def test_sma_empty_history_returns_502(client: TestClient) -> None:
    token = _register_and_login(client)
    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        return_value=FakeTicker(history_frame=pd.DataFrame()),
    ):
        response = client.get(
            "/api/v1/analytics/SFTESTA/sma?window=2",
            headers=_auth_header(token),
        )
    assert response.status_code == 502


def test_sma_insufficient_data_all_null_values(client: TestClient) -> None:
    token = _register_and_login(client)
    frame = pd.DataFrame(
        {
            "Open": [100.0],
            "High": [102.0],
            "Low": [99.0],
            "Close": [100.0],
            "Volume": [1000],
        },
        index=pd.to_datetime(["2026-01-02"]),
    )
    fake = FakeTicker(history_frame=frame)
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/analytics/SFTESTA/sma?window=2",
            headers=_auth_header(token),
        )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["rows"]) == 1
    assert payload["rows"][0]["value"] is None
    assert payload["latest"] is None


def test_sma_refresh_delegates_to_market_data(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame(close=200.0))
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/analytics/SFTESTC/sma?window=2&refresh=true",
            headers=_auth_header(token),
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "yfinance"
    assert payload["cached"] is False


def test_sma_latest_returns_last_non_null(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame())
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/analytics/SFTESTA/sma?window=2",
            headers=_auth_header(token),
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["latest"] is not None
    assert payload["latest"]["date"] == payload["rows"][-1]["date"]
    assert payload["latest"]["value"] == pytest.approx(101.5)


# --- EMA ---


def test_ema_returns_expected_values(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame())
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/analytics/SFTESTA/ema?window=2",
            headers=_auth_header(token),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["ticker"] == "SFTESTA"
    assert payload["indicator"] == "ema"
    assert payload["parameters"] == {"window": 2}
    assert payload["provider"] == "yfinance"
    assert payload["cached"] is False

    rows = payload["rows"]
    assert len(rows) == 2
    assert rows[0]["date"] == "2026-01-02"
    assert rows[0]["close"] == 101.0
    assert rows[0]["value"] is None
    assert rows[1]["date"] == "2026-01-03"
    assert rows[1]["close"] == 102.0

    expected_ema = 102.0 * 2.0 / 3.0 + 101.0 * 1.0 / 3.0
    assert rows[1]["value"] == pytest.approx(expected_ema)


def test_ema_uses_cached_data(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame())
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        first_resp = client.get(
            "/api/v1/analytics/SFTESTB/ema?window=2",
            headers=_auth_header(token),
        )
    assert first_resp.status_code == 200
    assert first_resp.json()["provider"] == "yfinance"

    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        side_effect=AssertionError("provider should not be called"),
    ):
        second_resp = client.get(
            "/api/v1/analytics/SFTESTB/ema?window=2",
            headers=_auth_header(token),
        )
    assert second_resp.status_code == 200
    assert second_resp.json()["provider"] == "database"
    assert second_resp.json()["cached"] is True


def test_ema_provider_failure_returns_502(client: TestClient) -> None:
    token = _register_and_login(client)
    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        side_effect=RuntimeError("provider down"),
    ):
        response = client.get(
            "/api/v1/analytics/SFTESTA/ema?window=2",
            headers=_auth_header(token),
        )
    assert response.status_code == 502


def test_ema_empty_history_returns_502(client: TestClient) -> None:
    token = _register_and_login(client)
    with patch(
        "backend.app.services.market_data_service.yf.Ticker",
        return_value=FakeTicker(history_frame=pd.DataFrame()),
    ):
        response = client.get(
            "/api/v1/analytics/SFTESTA/ema?window=2",
            headers=_auth_header(token),
        )
    assert response.status_code == 502


def test_ema_insufficient_data_all_null_values(client: TestClient) -> None:
    token = _register_and_login(client)
    frame = pd.DataFrame(
        {
            "Open": [100.0],
            "High": [102.0],
            "Low": [99.0],
            "Close": [100.0],
            "Volume": [1000],
        },
        index=pd.to_datetime(["2026-01-02"]),
    )
    fake = FakeTicker(history_frame=frame)
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/analytics/SFTESTA/ema?window=2",
            headers=_auth_header(token),
        )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["rows"]) == 1
    assert payload["rows"][0]["value"] is None
    assert payload["latest"] is None


def test_ema_refresh_delegates_to_market_data(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame(close=200.0))
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/analytics/SFTESTC/ema?window=2&refresh=true",
            headers=_auth_header(token),
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "yfinance"
    assert payload["cached"] is False


def test_ema_latest_returns_last_non_null(client: TestClient) -> None:
    token = _register_and_login(client)
    fake = FakeTicker(history_frame=_history_frame())
    with patch("backend.app.services.market_data_service.yf.Ticker", return_value=fake):
        response = client.get(
            "/api/v1/analytics/SFTESTA/ema?window=2",
            headers=_auth_header(token),
        )
    assert response.status_code == 200
    payload = response.json()
    assert payload["latest"] is not None
    assert payload["latest"]["date"] == payload["rows"][-1]["date"]
    expected_ema = 102.0 * 2.0 / 3.0 + 101.0 * 1.0 / 3.0
    assert payload["latest"]["value"] == pytest.approx(expected_ema)
