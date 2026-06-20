from pydantic import BaseModel


class SearchResultItem(BaseModel):
    ticker: str
    name: str | None = None
    exchange: str | None = None
    type: str | None = None


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResultItem]
