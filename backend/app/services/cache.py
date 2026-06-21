import threading
import time
from collections import OrderedDict
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    """Thread-safe in-memory cache with time-to-live eviction."""

    def __init__(self, maxsize: int = 256, ttl_seconds: int = 60) -> None:
        self._maxsize = maxsize
        self._ttl = ttl_seconds
        self._store: OrderedDict[str, tuple[float, T]] = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> T | None:
        with self._lock:
            if key not in self._store:
                return None
            expires_at, value = self._store[key]
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            self._store.move_to_end(key)
            return value

    def set(self, key: str, value: T) -> None:
        with self._lock:
            expires_at = time.monotonic() + self._ttl
            self._store[key] = (expires_at, value)
            self._store.move_to_end(key)
            while len(self._store) > self._maxsize:
                self._store.popitem(last=False)

    def invalidate(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


quote_cache: TTLCache[Any] = TTLCache(maxsize=512, ttl_seconds=60)
history_cache: TTLCache[Any] = TTLCache(maxsize=256, ttl_seconds=300)
signal_cache: TTLCache[Any] = TTLCache(maxsize=256, ttl_seconds=60)


def clear_all_caches() -> None:
    quote_cache.clear()
    history_cache.clear()
    signal_cache.clear()
