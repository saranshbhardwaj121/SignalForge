from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.models.alert import Alert, TriggeredAlert


class AlertRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, alert: Alert) -> Alert:
        self.session.add(alert)
        return alert

    def get_by_id(self, alert_id: UUID) -> Alert | None:
        return self.session.get(Alert, alert_id)

    def get_owned_by_id(self, user_id: UUID, alert_id: UUID) -> Alert | None:
        return self.session.scalar(
            select(Alert).where(Alert.id == alert_id, Alert.user_id == user_id)
        )

    def list_for_user(
        self, user_id: UUID, status: str | None = None
    ) -> Sequence[Alert]:
        stmt = select(Alert).where(Alert.user_id == user_id)
        if status is not None:
            stmt = stmt.where(Alert.status == status)
        stmt = stmt.order_by(Alert.created_at.desc())
        return self.session.scalars(stmt).all()

    def list_active(self) -> Sequence[Alert]:
        return self.session.scalars(
            select(Alert).where(Alert.status == "active")
        ).all()

    def delete(self, alert: Alert) -> None:
        self.session.delete(alert)


class TriggeredAlertRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def create(self, record: TriggeredAlert) -> TriggeredAlert:
        self.session.add(record)
        return record

    def list_for_alert(
        self, alert_id: UUID, limit: int = 50, offset: int = 0
    ) -> Sequence[TriggeredAlert]:
        return self.session.scalars(
            select(TriggeredAlert)
            .where(TriggeredAlert.alert_id == alert_id)
            .order_by(TriggeredAlert.triggered_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()

    def count_for_alert(self, alert_id: UUID) -> int:
        result = self.session.scalar(
            select(func.count()).select_from(TriggeredAlert).where(
                TriggeredAlert.alert_id == alert_id
            )
        )
        return result or 0
