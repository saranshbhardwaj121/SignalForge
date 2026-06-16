from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from backend.app.models.user import User
from backend.app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.users = UserRepository(session)

    def register_user(self, username: str, email: str, password: str) -> User:
        existing_username = self.users.get_by_username(username)
        if existing_username is not None:
            raise ValueError("Username already exists")

        existing_email = self.users.get_by_email(email)
        if existing_email is not None:
            raise ValueError("Email already exists")

        user = User(username=username, email=email, password_hash=hash_password(password))
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def authenticate_user(self, identifier: str, password: str) -> User | None:
        user = self.users.get_by_username(identifier) or self.users.get_by_email(identifier)
        if user is None:
            return None

        if not verify_password(password, user.password_hash):
            return None

        user.last_login_at = datetime.now(timezone.utc)
        self.session.commit()
        return user

    def issue_access_token(self, user: User) -> str:
        return create_access_token(subject=str(user.id))

    def issue_refresh_token(self, user: User) -> str:
        return create_refresh_token(subject=str(user.id))

    def user_from_refresh_token(self, refresh_token: str) -> User:
        payload = decode_token(refresh_token)
        token_type = payload.get("type")
        subject = payload.get("sub")
        if token_type != "refresh" or subject is None:
            raise ValueError("Invalid refresh token")

        user = self.users.get_by_id(UUID(subject))
        if user is None or not user.is_active:
            raise ValueError("Invalid refresh token")
        return user
