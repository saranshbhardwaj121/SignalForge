from datetime import date, datetime

from pydantic import BaseModel


class IndicatorPoint(BaseModel):
    date: date
    close: float
    value: float | None = None


class IndicatorResponse(BaseModel):
    ticker: str
    indicator: str
    period: str
    interval: str
    parameters: dict[str, int]
    rows: list[IndicatorPoint]
    latest: IndicatorPoint | None = None
    provider: str
    cached: bool
    fetched_at: datetime
