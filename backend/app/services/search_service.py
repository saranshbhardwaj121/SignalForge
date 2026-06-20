from functools import lru_cache

import httpx

from backend.app.schemas.search import SearchResponse, SearchResultItem

YAHOO_SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search"
SEARCH_TIMEOUT = 10
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
}


class SearchProviderError(RuntimeError):
    pass


@lru_cache(maxsize=256)
def search_tickers(query: str, limit: int = 10) -> list[dict[str, str]]:
    """Call Yahoo Finance autocomplete API, cache results in-memory."""
    params: dict[str, object] = {"q": query, "quotesCount": limit, "newsCount": 0}

    try:
        with httpx.Client(timeout=SEARCH_TIMEOUT, headers=_HEADERS) as client:
            response = client.get(YAHOO_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.RequestError as exc:
        raise SearchProviderError("Search provider unreachable") from exc
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise SearchProviderError(
                "Search provider rate limit exceeded. Try again shortly."
            ) from exc
        raise SearchProviderError(
            f"Search provider returned status {exc.response.status_code}"
        ) from exc

    quotes = data.get("quotes", [])
    results: list[dict[str, str]] = []
    seen: set[str] = set()

    for quote in quotes:
        symbol = quote.get("symbol")
        if not symbol or not isinstance(symbol, str):
            continue
        symbol = symbol.strip().upper()
        if symbol in seen:
            continue
        seen.add(symbol)
        results.append(
            {
                "ticker": symbol,
                "name": (quote.get("shortname") or quote.get("longname") or "").strip(),
                "exchange": (quote.get("exchange") or "").strip(),
                "type": (quote.get("quoteType") or "").strip(),
            }
        )

    return results


class SearchService:
    def search(self, query: str, limit: int = 10) -> SearchResponse:
        clean_query = query.strip()
        if not clean_query:
            return SearchResponse(query=query, results=[])

        raw_results = search_tickers(clean_query, limit)
        items = [
            SearchResultItem(
                ticker=r["ticker"],
                name=r["name"] or None,
                exchange=r["exchange"] or None,
                type=r["type"] or None,
            )
            for r in raw_results[:limit]
        ]

        return SearchResponse(query=query, results=items)
