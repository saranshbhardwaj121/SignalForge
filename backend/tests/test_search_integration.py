from uuid import uuid4
from unittest.mock import patch

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.app.api.deps import get_session
from backend.app.core.config import get_settings
from backend.app.main import app
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


def _mock_yahoo_response(data: list[dict[str, str]]) -> dict:
    return {"quotes": data, "news": []}


class FakeResponse:
    def __init__(self, status_code: int, json_data: object) -> None:
        self.status_code = status_code
        self._json_data = json_data

    def json(self) -> object:
        return self._json_data

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise Exception(f"HTTP {self.status_code}")

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *args: object) -> None:
        pass


class FakeClient:
    def __init__(self, response: FakeResponse) -> None:
        self._response = response

    def __enter__(self) -> "FakeClient":
        return self

    def __exit__(self, *args: object) -> None:
        pass

    def get(self, url: str, params: dict[str, object] | None = None) -> FakeResponse:  # noqa: ARG002
        return self._response


def test_search_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/market-data/search?q=HDFC")
    assert response.status_code == 401


def test_search_returns_results(client: TestClient) -> None:
    token = _register_and_login(client)
    mock_data = _mock_yahoo_response(
        [
            {"symbol": "HDFCBANK.NS", "shortname": "HDFC Bank Ltd", "exchange": "NSI", "quoteType": "EQUITY"},
            {"symbol": "HDFCLIFE.NS", "shortname": "HDFC Life Insurance", "exchange": "NSI", "quoteType": "EQUITY"},
            {"symbol": "HDFC.NS", "shortname": "Housing Development Finance Corp", "exchange": "NSI", "quoteType": "EQUITY"},
        ]
    )
    fake_resp = FakeResponse(200, mock_data)
    fake_client = FakeClient(fake_resp)

    with patch("backend.app.services.search_service.httpx.Client", return_value=fake_client):
        response = client.get(
            "/api/v1/market-data/search?q=HDFC",
            headers=_auth_header(token),
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["query"] == "HDFC"
    assert len(payload["results"]) == 3
    assert payload["results"][0]["ticker"] == "HDFCBANK.NS"
    assert payload["results"][0]["name"] == "HDFC Bank Ltd"
    assert payload["results"][0]["exchange"] == "NSI"


def test_search_empty_query_returns_empty(client: TestClient) -> None:
    token = _register_and_login(client)
    response = client.get(
        "/api/v1/market-data/search?q=",
        headers=_auth_header(token),
    )
    assert response.status_code == 200
    assert response.json()["results"] == []


def test_search_provider_failure_returns_502(client: TestClient) -> None:
    token = _register_and_login(client)

    with patch("backend.app.services.search_service.httpx.Client") as mock_client_cls:
        mock_client_instance = mock_client_cls.return_value.__enter__.return_value
        mock_client_instance.get.side_effect = httpx.RequestError("provider unreachable")

        response = client.get(
            "/api/v1/market-data/search?q=ZZPROVIDERFAIL",
            headers=_auth_header(token),
        )

    assert response.status_code == 502
    assert "unavailable" in response.json()["detail"]


def test_search_normalizes_tickers_to_uppercase(client: TestClient) -> None:
    token = _register_and_login(client)
    mock_data = _mock_yahoo_response(
        [
            {"symbol": "hdfcbank.ns", "shortname": "HDFC Bank Ltd", "exchange": "NSI", "quoteType": "EQUITY"},
        ]
    )
    fake_resp = FakeResponse(200, mock_data)
    fake_client = FakeClient(fake_resp)

    with patch("backend.app.services.search_service.httpx.Client", return_value=fake_client):
        response = client.get(
            "/api/v1/market-data/search?q=hdfc",
            headers=_auth_header(token),
        )

    assert response.status_code == 200
    assert response.json()["results"][0]["ticker"] == "HDFCBANK.NS"


def test_search_deduplicates_duplicate_tickers(client: TestClient) -> None:
    token = _register_and_login(client)
    mock_data = _mock_yahoo_response(
        [
            {"symbol": "HDFCBANK.NS", "shortname": "HDFC Bank Ltd", "exchange": "NSI", "quoteType": "EQUITY"},
            {"symbol": "HDFCBANK.NS", "shortname": "HDFC Bank Ltd", "exchange": "NSI", "quoteType": "EQUITY"},
        ]
    )
    fake_resp = FakeResponse(200, mock_data)
    fake_client = FakeClient(fake_resp)

    with patch("backend.app.services.search_service.httpx.Client", return_value=fake_client):
        response = client.get(
            "/api/v1/market-data/search?q=HDFCBANK",
            headers=_auth_header(token),
        )

    assert response.status_code == 200
    assert len(response.json()["results"]) == 1


def test_search_returns_empty_for_no_results(client: TestClient) -> None:
    token = _register_and_login(client)
    mock_data = _mock_yahoo_response([])
    fake_resp = FakeResponse(200, mock_data)
    fake_client = FakeClient(fake_resp)

    with patch("backend.app.services.search_service.httpx.Client", return_value=fake_client):
        response = client.get(
            "/api/v1/market-data/search?q=ZZZZZ",
            headers=_auth_header(token),
        )

    assert response.status_code == 200
    assert response.json()["results"] == []
