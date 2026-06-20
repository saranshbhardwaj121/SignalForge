from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

ALERT_TYPES = ["price", "signal", "confidence", "rsi"]
OPERATORS = ["gt", "lt", "gte", "lte", "eq"]
ALERT_STATUSES = ["active", "inactive"]


class AlertCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    alert_type: str
    operator: str
    threshold: float
    parameters: dict[str, object] | None = None

    @model_validator(mode="after")
    def validate_alert(self) -> "AlertCreate":
        if self.alert_type not in ALERT_TYPES:
            raise ValueError(f"alert_type must be one of {ALERT_TYPES}")
        if self.operator not in OPERATORS:
            raise ValueError(f"operator must be one of {OPERATORS}")
        return self


class AlertUpdate(BaseModel):
    status: str | None = None
    threshold: float | None = None
    operator: str | None = None
    parameters: dict[str, object] | None = None

    @model_validator(mode="after")
    def validate_update(self) -> "AlertUpdate":
        if self.status is not None and self.status not in ALERT_STATUSES:
            raise ValueError(f"status must be one of {ALERT_STATUSES}")
        if self.operator is not None and self.operator not in OPERATORS:
            raise ValueError(f"operator must be one of {OPERATORS}")
        return self


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ticker: str
    alert_type: str
    operator: str
    threshold: float
    parameters: dict[str, object] | None
    status: str
    created_at: datetime
    updated_at: datetime
    trigger_count: int = 0


class TriggeredAlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    alert_id: UUID
    ticker: str
    alert_type: str
    operator: str
    threshold: float
    triggered_value: float
    triggered_at: datetime
    snapshot: dict[str, object] | None = None
