import pytest
from backend.app.services.cache import clear_all_caches


@pytest.fixture(autouse=True)
def clear_caches() -> None:
    clear_all_caches()
