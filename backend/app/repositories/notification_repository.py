from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from backend.app.models.notification import Notification


class NotificationRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, notification: Notification) -> Notification:
        self.session.add(notification)
        return notification

    def get_owned_by_id(self, user_id: UUID, notification_id: UUID) -> Notification | None:
        return self.session.scalar(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )

    def list_for_user(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
    ) -> Sequence[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        if unread_only:
            stmt = stmt.where(Notification.is_read == False)
        return self.session.scalars(stmt).all()

    def unread_count(self, user_id: UUID) -> int:
        result = self.session.scalar(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
        )
        return result or 0

    def mark_read(self, notification: Notification) -> Notification:
        from datetime import datetime, timezone

        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        return notification

    def mark_all_read(self, user_id: UUID) -> int:
        from datetime import datetime, timezone

        result = self.session.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .values(is_read=True, read_at=datetime.now(timezone.utc))
        )
        return result.rowcount

    def delete_older_than(self, cutoff: "datetime") -> int:
        result = self.session.execute(
            select(Notification).where(Notification.created_at < cutoff)
        )
        rows = result.scalars().all()
        for row in rows:
            self.session.delete(row)
        return len(rows)
