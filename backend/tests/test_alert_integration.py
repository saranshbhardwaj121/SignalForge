from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.api.deps import get_session
from backend.app.core.config import get_settings
from backend.app.main import app
from backend.app.models.alert import Alert, TriggeredAlert
from backend.app.models.base import Base
from backend.app.models.user import User

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


# --- Unauthenticated ---


def test_list_alerts_unauthenticated_returns_401(client: TestClient) -> None:
    resp = client.get("/api/v1/alerts")
    assert resp.status_code == 401


def test_create_alert_unauthenticated_returns_401(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
    )
    assert resp.status_code == 401


# --- Create ---


def test_create_price_alert_success(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["ticker"] == "RELIANCE.NS"
    assert data["alert_type"] == "price"
    assert data["operator"] == "gt"
    assert data["threshold"] == 3500
    assert data["status"] == "active"
    assert data["trigger_count"] == 0
    assert "id" in data


def test_create_signal_alert_success(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.post(
        "/api/v1/alerts",
        json={"ticker": "INFY.NS", "alert_type": "signal", "operator": "gte", "threshold": 2},
        headers=_auth_header(token),
    )
    assert resp.status_code == 201
    assert resp.json()["alert_type"] == "signal"


def test_create_confidence_alert_success(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.post(
        "/api/v1/alerts",
        json={"ticker": "TCS.NS", "alert_type": "confidence", "operator": "gt", "threshold": 0.8},
        headers=_auth_header(token),
    )
    assert resp.status_code == 201
    assert resp.json()["alert_type"] == "confidence"


def test_create_rsi_alert_with_parameters(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.post(
        "/api/v1/alerts",
        json={
            "ticker": "RELIANCE.NS",
            "alert_type": "rsi",
            "operator": "lt",
            "threshold": 30,
            "parameters": {"rsi_window": 14},
        },
        headers=_auth_header(token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["alert_type"] == "rsi"
    assert data["parameters"] == {"rsi_window": 14}


def test_create_alert_invalid_type_rejected(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "invalid", "operator": "gt", "threshold": 100},
        headers=_auth_header(token),
    )
    assert resp.status_code == 422


def test_create_alert_invalid_operator_rejected(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "xx", "threshold": 100},
        headers=_auth_header(token),
    )
    assert resp.status_code == 422


# --- List ---


def test_list_alerts_returns_user_alerts(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token),
    )
    client.post(
        "/api/v1/alerts",
        json={"ticker": "HDFCBANK.NS", "alert_type": "price", "operator": "lt", "threshold": 1800},
        headers=_auth_header(token),
    )
    resp = client.get("/api/v1/alerts", headers=_auth_header(token))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


def test_list_alerts_other_user_not_visible(client: TestClient) -> None:
    token1, _, _ = _register_and_login(client)
    token2, _, _ = _register_and_login(client)
    client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token1),
    )
    resp = client.get("/api/v1/alerts", headers=_auth_header(token2))
    assert len(resp.json()) == 0


def test_list_alerts_filter_by_status(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token),
    )
    alert2 = client.post(
        "/api/v1/alerts",
        json={"ticker": "HDFCBANK.NS", "alert_type": "price", "operator": "lt", "threshold": 1800},
        headers=_auth_header(token),
    ).json()
    client.patch(
        f"/api/v1/alerts/{alert2['id']}",
        json={"status": "inactive"},
        headers=_auth_header(token),
    )
    active = client.get("/api/v1/alerts?status=active", headers=_auth_header(token))
    assert len(active.json()) == 1
    inactive = client.get("/api/v1/alerts?status=inactive", headers=_auth_header(token))
    assert len(inactive.json()) == 1


# --- Get ---


def test_get_alert_by_id(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    created = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token),
    ).json()
    resp = client.get(f"/api/v1/alerts/{created['id']}", headers=_auth_header(token))
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


def test_get_alert_not_found(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.get(f"/api/v1/alerts/{uuid4()}", headers=_auth_header(token))
    assert resp.status_code == 404


def test_get_alert_not_owned(client: TestClient) -> None:
    token1, _, _ = _register_and_login(client)
    token2, _, _ = _register_and_login(client)
    created = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token1),
    ).json()
    resp = client.get(f"/api/v1/alerts/{created['id']}", headers=_auth_header(token2))
    assert resp.status_code == 404


# --- Update ---


def test_update_alert_threshold(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    created = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token),
    ).json()
    resp = client.patch(
        f"/api/v1/alerts/{created['id']}",
        json={"threshold": 4000},
        headers=_auth_header(token),
    )
    assert resp.status_code == 200
    assert resp.json()["threshold"] == 4000


def test_update_alert_status(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    created = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token),
    ).json()
    resp = client.patch(
        f"/api/v1/alerts/{created['id']}",
        json={"status": "inactive"},
        headers=_auth_header(token),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "inactive"


def test_update_alert_not_found(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.patch(
        f"/api/v1/alerts/{uuid4()}",
        json={"threshold": 4000},
        headers=_auth_header(token),
    )
    assert resp.status_code == 404


# --- Delete ---


def test_delete_alert(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    created = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token),
    ).json()
    resp = client.delete(f"/api/v1/alerts/{created['id']}", headers=_auth_header(token))
    assert resp.status_code == 204
    get_resp = client.get(f"/api/v1/alerts/{created['id']}", headers=_auth_header(token))
    assert get_resp.status_code == 404


def test_delete_alert_not_found(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.delete(f"/api/v1/alerts/{uuid4()}", headers=_auth_header(token))
    assert resp.status_code == 404


# --- Triggers ---


def test_trigger_history_empty(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    created = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token),
    ).json()
    resp = client.get(
        f"/api/v1/alerts/{created['id']}/triggers",
        headers=_auth_header(token),
    )
    assert resp.status_code == 200
    assert resp.json() == []


def test_trigger_history_not_owned(client: TestClient) -> None:
    token1, _, _ = _register_and_login(client)
    token2, _, _ = _register_and_login(client)
    created = client.post(
        "/api/v1/alerts",
        json={"ticker": "RELIANCE.NS", "alert_type": "price", "operator": "gt", "threshold": 3500},
        headers=_auth_header(token1),
    ).json()
    resp = client.get(
        f"/api/v1/alerts/{created['id']}/triggers",
        headers=_auth_header(token2),
    )
    assert resp.status_code == 404
