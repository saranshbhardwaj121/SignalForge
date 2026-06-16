from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Deque


class LoginRateLimiter:
    def __init__(self, max_attempts: int, window_seconds: int) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, Deque[datetime]] = defaultdict(deque)
        self._lock = Lock()

    def is_allowed(self, key: str) -> bool:
        with self._lock:
            self._prune(key)
            return len(self._attempts[key]) < self.max_attempts

    def register_failure(self, key: str) -> None:
        with self._lock:
            self._prune(key)
            self._attempts[key].append(datetime.now(timezone.utc))

    def reset(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)

    def _prune(self, key: str) -> None:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=self.window_seconds)
        while self._attempts[key] and self._attempts[key][0] <= cutoff:
            self._attempts[key].popleft()
