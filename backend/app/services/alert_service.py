from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models.alert import Alert, TriggeredAlert
from backend.app.models.user import User
from backend.app.repositories.alert_repository import (
    AlertRepository,
    TriggeredAlertRepository,
)
from backend.app.schemas.alert import AlertCreate, AlertUpdate


class AlertService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.alert_repo = AlertRepository(session)
        self.trigger_repo = TriggeredAlertRepository(session)

    def create_alert(self, user: User, payload: AlertCreate) -> Alert:
        alert = Alert(
            user_id=user.id,
            ticker=payload.ticker.strip().upper(),
            alert_type=payload.alert_type,
            operator=payload.operator,
            threshold=payload.threshold,
            parameters=payload.parameters,
        )
        self.alert_repo.create(alert)
        try:
            self.session.commit()
            self.session.refresh(alert)
        except IntegrityError as exc:
            self.session.rollback()
            raise ValueError("Failed to create alert") from exc
        return alert

    def list_alerts(self, user: User, status: str | None = None) -> list[Alert]:
        return list(self.alert_repo.list_for_user(user.id, status))

    def list_alerts_with_counts(self, user: User, status: str | None = None) -> list[tuple[Alert, int]]:
        alerts = self.list_alerts(user, status)
        if not alerts:
            return []
        alert_ids = [a.id for a in alerts]
        counts = self.trigger_repo.count_for_alerts(alert_ids)
        return [(alert, counts.get(alert.id, 0)) for alert in alerts]

    def get_alert(self, user: User, alert_id: UUID) -> Alert:
        alert = self.alert_repo.get_owned_by_id(user.id, alert_id)
        if alert is None:
            raise ValueError("Alert not found")
        return alert

    def update_alert(self, user: User, alert_id: UUID, payload: AlertUpdate) -> Alert:
        alert = self.alert_repo.get_owned_by_id(user.id, alert_id)
        if alert is None:
            raise ValueError("Alert not found")
        if payload.status is not None:
            alert.status = payload.status
        if payload.threshold is not None:
            alert.threshold = payload.threshold
        if payload.operator is not None:
            alert.operator = payload.operator
        if payload.parameters is not None:
            alert.parameters = payload.parameters
        try:
            self.session.commit()
            self.session.refresh(alert)
        except IntegrityError as exc:
            self.session.rollback()
            raise ValueError("Failed to update alert") from exc
        return alert

    def delete_alert(self, user: User, alert_id: UUID) -> None:
        alert = self.alert_repo.get_owned_by_id(user.id, alert_id)
        if alert is None:
            raise ValueError("Alert not found")
        self.alert_repo.delete(alert)
        self.session.commit()

    def get_trigger_history(
        self,
        user: User,
        alert_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[TriggeredAlert], int]:
        alert = self.alert_repo.get_owned_by_id(user.id, alert_id)
        if alert is None:
            raise ValueError("Alert not found")
        triggers = list(self.trigger_repo.list_for_alert(alert_id, limit, offset))
        total = self.trigger_repo.count_for_alert(alert_id)
        return triggers, total

    def get_trigger_count(self, alert_id: UUID) -> int:
        return self.trigger_repo.count_for_alert(alert_id)
