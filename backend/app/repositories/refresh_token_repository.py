from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend.app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, token: RefreshToken) -> RefreshToken:
        self.session.add(token)
        return token

    def get_active_by_jti(self, token_jti: str) -> RefreshToken | None:
        now = datetime.now(timezone.utc)
        statement = select(RefreshToken).where(
            RefreshToken.token_jti == token_jti,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now,
        )
        return self.session.scalar(statement)

    def revoke_by_jti(self, token_jti: str) -> bool:
        token = self.session.scalar(select(RefreshToken).where(RefreshToken.token_jti == token_jti))
        if token is None or token.revoked_at is not None:
            return False
        token.revoked_at = datetime.now(timezone.utc)
        return True

    def revoke_all_by_user_id(self, user_id) -> int:
        now = datetime.now(timezone.utc)
        statement = (
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        result = self.session.execute(statement)
        return result.rowcount
