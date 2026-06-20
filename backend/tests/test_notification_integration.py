from datetime import datetime, timezone
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
from backend.app.models.notification import Notification
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
        db.query(Notification).delete(synchronize_session=False)
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


def _create_notification(
    db_session: Session, user_id: str, ticker: str = "RELIANCE.NS"
) -> Notification:
    notification = Notification(
        user_id=user_id,
        alert_id=None,
        ticker=ticker,
        alert_type="price",
        title=f"{ticker} price alert triggered",
        body="PRICE 3512.00 > 3500.00",
        triggered_value=3512.0,
        threshold=3500.0,
        triggered_at=datetime.now(timezone.utc),
    )
    db_session.add(notification)
    db_session.commit()
    db_session.refresh(notification)
    return notification


# --- Unauthenticated ---


def test_list_notifications_unauthenticated_returns_401(client: TestClient) -> None:
    resp = client.get("/api/v1/notifications")
    assert resp.status_code == 401


def test_unread_count_unauthenticated_returns_401(client: TestClient) -> None:
    resp = client.get("/api/v1/notifications/count")
    assert resp.status_code == 401


def test_mark_read_unauthenticated_returns_401(client: TestClient) -> None:
    resp = client.patch(f"/api/v1/notifications/{uuid4()}/read")
    assert resp.status_code == 401


def test_mark_all_read_unauthenticated_returns_401(client: TestClient) -> None:
    resp = client.patch("/api/v1/notifications/read-all")
    assert resp.status_code == 401


# --- List / Count ---


def test_list_notifications_empty_for_new_user(client: TestClient, db_session: Session) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.get("/api/v1/notifications", headers=_auth_header(token))
    assert resp.status_code == 200
    assert resp.json() == []


def test_unread_count_zero_for_new_user(client: TestClient, db_session: Session) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.get("/api/v1/notifications/count", headers=_auth_header(token))
    assert resp.status_code == 200
    assert resp.json() == {"count": 0}


def test_list_notifications_returns_notifications(client: TestClient, db_session: Session) -> None:
    token, _, _ = _register_and_login(client)
    user = db_session.query(User).filter(User.username.like("sf_test_%")).first()
    _create_notification(db_session, str(user.id))

    resp = client.get("/api/v1/notifications", headers=_auth_header(token))
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["ticker"] == "RELIANCE.NS"
    assert data[0]["alert_type"] == "price"
    assert data[0]["is_read"] is False


def test_unread_count_reflects_notifications(client: TestClient, db_session: Session) -> None:
    token, _, _ = _register_and_login(client)
    user = db_session.query(User).filter(User.username.like("sf_test_%")).first()
    _create_notification(db_session, str(user.id))

    resp = client.get("/api/v1/notifications/count", headers=_auth_header(token))
    assert resp.status_code == 200
    assert resp.json() == {"count": 1}


def test_list_notifications_respects_limit(client: TestClient, db_session: Session) -> None:
    token, _, _ = _register_and_login(client)
    user = db_session.query(User).filter(User.username.like("sf_test_%")).first()
    _create_notification(db_session, str(user.id), "RELIANCE.NS")
    _create_notification(db_session, str(user.id), "HDFCBANK.NS")

    resp = client.get("/api/v1/notifications?limit=1", headers=_auth_header(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


# --- Mark Read ---


def test_mark_read_single_notification(client: TestClient, db_session: Session) -> None:
    token, _, _ = _register_and_login(client)
    user = db_session.query(User).filter(User.username.like("sf_test_%")).first()
    notification = _create_notification(db_session, str(user.id))

    resp = client.patch(
        f"/api/v1/notifications/{notification.id}/read",
        headers=_auth_header(token),
    )
    assert resp.status_code == 200
    assert resp.json()["is_read"] is True
    assert resp.json()["read_at"] is not None


def test_unread_count_decreases_after_mark_read(client: TestClient, db_session: Session) -> None:
    token, _, _ = _register_and_login(client)
    user = db_session.query(User).filter(User.username.like("sf_test_%")).first()
    notification = _create_notification(db_session, str(user.id))

    client.patch(
        f"/api/v1/notifications/{notification.id}/read",
        headers=_auth_header(token),
    )
    resp = client.get("/api/v1/notifications/count", headers=_auth_header(token))
    assert resp.json()["count"] == 0


def test_mark_all_read_clears_all(client: TestClient, db_session: Session) -> None:
    token, _, _ = _register_and_login(client)
    user = db_session.query(User).filter(User.username.like("sf_test_%")).first()
    _create_notification(db_session, str(user.id))
    _create_notification(db_session, str(user.id))

    resp = client.patch(
        "/api/v1/notifications/read-all",
        headers=_auth_header(token),
    )
    assert resp.status_code == 200
    assert resp.json() == {"count": 0}

    count_resp = client.get("/api/v1/notifications/count", headers=_auth_header(token))
    assert count_resp.json()["count"] == 0


def test_mark_read_not_found_returns_404(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.patch(
        f"/api/v1/notifications/{uuid4()}/read",
        headers=_auth_header(token),
    )
    assert resp.status_code == 404


# --- Ownership ---


def test_notifications_isolated_between_users(client: TestClient, db_session: Session) -> None:
    token1, _, _ = _register_and_login(client)
    user1 = db_session.query(User).filter(User.username.like("sf_test_%")).first()
    _create_notification(db_session, str(user1.id))

    token2, _, _ = _register_and_login(client)
    resp2 = client.get("/api/v1/notifications", headers=_auth_header(token2))
    assert resp2.json() == []


def test_mark_read_others_notification_returns_404(client: TestClient, db_session: Session) -> None:
    token1, _, _ = _register_and_login(client)
    user1 = db_session.query(User).filter(User.username.like("sf_test_%")).first()
    notification = _create_notification(db_session, str(user1.id))

    token2, _, _ = _register_and_login(client)
    resp = client.patch(
        f"/api/v1/notifications/{notification.id}/read",
        headers=_auth_header(token2),
    )
    assert resp.status_code == 404


# --- Preferences ---


def test_get_notification_preferences(client: TestClient) -> None:
    token, _, _ = _register_and_login(client)
    resp = client.get("/api/v1/notifications/preferences", headers=_auth_header(token))
    assert resp.status_code == 200
    assert resp.json() == {"in_app": True}
