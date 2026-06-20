from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.models.notification import Notification
from backend.app.repositories.notification_repository import NotificationRepository


def _operator_label(operator: str) -> str:
    labels = {"gt": ">", "lt": "<", "gte": "≥", "lte": "≤", "eq": "="}
    return labels.get(operator, operator)


_NOTIFICATION_RETENTION_DAYS = 90


class NotificationService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.repo = NotificationRepository(session)

    def create_notification(
        self,
        user_id: UUID,
        alert_id: UUID,
        ticker: str,
        alert_type: str,
        triggered_value: float,
        threshold: float,
        triggered_at: datetime | None = None,
    ) -> Notification:
        title = f"{ticker} {alert_type} alert triggered"
        body = (
            f"{alert_type.upper()} {triggered_value:.2f} "
            f"{_operator_label('gt')} {threshold:.2f}"
        )
        notification = Notification(
            user_id=user_id,
            alert_id=alert_id,
            ticker=ticker,
            alert_type=alert_type,
            title=title,
            body=body,
            triggered_value=triggered_value,
            threshold=threshold,
            triggered_at=triggered_at or datetime.now(timezone.utc),
        )
        self.repo.create(notification)
        return notification

    def list_notifications(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False,
    ) -> list[Notification]:
        return list(self.repo.list_for_user(user_id, limit, offset, unread_only))

    def get_unread_count(self, user_id: UUID) -> int:
        return self.repo.unread_count(user_id)

    def mark_read(self, user_id: UUID, notification_id: UUID) -> Notification:
        notification = self.repo.get_owned_by_id(user_id, notification_id)
        if notification is None:
            raise ValueError("Notification not found")
        self.repo.mark_read(notification)
        self.session.commit()
        return notification

    def mark_all_read(self, user_id: UUID) -> int:
        count = self.repo.mark_all_read(user_id)
        self.session.commit()
        return count

    def cleanup_old_notifications(self) -> int:
        from datetime import timedelta

        cutoff = datetime.now(timezone.utc) - timedelta(days=_NOTIFICATION_RETENTION_DAYS)
        count = self.repo.delete_older_than(cutoff)
        if count:
            self.session.commit()
        return count
