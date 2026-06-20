from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    alert_id: UUID | None
    ticker: str
    alert_type: str
    title: str
    body: str | None
    is_read: bool
    read_at: datetime | None
    triggered_value: float
    threshold: float
    triggered_at: datetime
    created_at: datetime


class UnreadCountResponse(BaseModel):
    count: int


class NotificationPreferences(BaseModel):
    in_app: bool = True
