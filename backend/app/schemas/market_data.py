from datetime import date, datetime

from pydantic import BaseModel


class QuoteRead(BaseModel):
    ticker: str
    name: str | None = None
    currency: str | None = None
    price: float | None = None
    previous_close: float | None = None
    open: float | None = None
    day_high: float | None = None
    day_low: float | None = None
    volume: int | None = None
    market_cap: int | None = None
    exchange: str | None = None
    provider: str
    fetched_at: datetime


class HistoricalBarRead(BaseModel):
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int


class HistoricalDataResponse(BaseModel):
    ticker: str
    period: str
    interval: str
    rows: list[HistoricalBarRead]
    provider: str
    cached: bool
    fetched_at: datetime
