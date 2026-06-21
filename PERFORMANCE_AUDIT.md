# Insique Performance Audit Report

**Date:** June 21, 2026
**Auditor:** OpenCode Performance Audit Agent
**Status:** Pre-optimization baseline

---

## 1. Executive Summary

Insique's perceived slowness has **one dominant root cause**: synchronous sequential calls to Yahoo Finance for every ticker in a watchlist or signal request. When a user loads a watchlist with 20 tickers, the backend makes **20 sequential HTTP calls** to Yahoo Finance, each taking 500ms–3s. This single pattern accounts for the majority of user-facing latency on the watchlist, analytics, and signals pages.

Secondary issues include an N+1 query in the alerts endpoint, excessive client-side re-rendering from context propagation, duplicate API requests from overlapping pre-fetching and page-level queries, and a 30-second poll for unread notification counts on every authenticated page.

**Estimated overall improvement potential:** 5–20x reduction in page load times for data-heavy pages (watchlists, signals), and 30–50% reduction in general navigation latency.

---

## 2. Top 10 Performance Issues

### Issue 1: Sequential Yahoo Finance Calls for Watchlist Quotes
- **Root Cause:** `WatchlistService.get_watchlist_quotes()` (`backend/app/services/watchlist_service.py:75`) iterates over tickers in a Python for-loop and calls `market_data_service.get_quote(ticker)` synchronously for each one. No parallelization or batching.
- **Severity:** Critical
- **Estimated Impact:** If a watchlist has 10 tickers and each Yahoo Finance call takes ~1s, this endpoint takes **~10s**. With 20 tickers: **~20s**. This is the single largest source of user-facing latency.
- **Recommended Fix:** Use `concurrent.futures.ThreadPoolExecutor` or `asyncio` to fetch quotes in parallel. Alternatively, batch quote requests if Yahoo Finance supports it (it does not natively, but parallelization alone yields 10–20x speedup).

### Issue 2: Sequential Yahoo Finance Calls for Watchlist Signals
- **Root Cause:** `WatchlistService.get_watchlist_signals()` (`backend/app/services/watchlist_service.py:133`) iterates tickers sequentially, calling `signal_service.get_signal_summary()` for each. Each signal computation calls `get_history()` (which may call Yahoo Finance) and computes 4 technical indicators.
- **Severity:** Critical
- **Estimated Impact:** For 10 tickers, each requiring a Yahoo Finance history fetch (~2s) + indicator computation (~200ms), total time = **~22s**.
- **Recommended Fix:** Parallelize signal computation across tickers using `ThreadPoolExecutor`. Also cache historical data per ticker in the database (already partially implemented but `refresh` parameter frequently set to `False` — ensure it stays `False`).

### Issue 3: N+1 Alert Query on Alert List Endpoint
- **Root Cause:** `GET /alerts` (`backend/app/api/v1/routes/alerts.py:22`) calls `service.get_trigger_count(alert.id)` inside a list comprehension over `N` alerts. Each call executes a separate `COUNT` query.
- **Severity:** High
- **Estimated Impact:** For a user with 20 alerts, the response generates **21 SQL queries** (1 for alerts + 20 for counts). Each query is fast (~1ms), but total overhead is ~20ms + network round-trips, and it scales linearly with alert count.
- **Recommended Fix:** Either (a) add a `trigger_count` column to the alert response schema via a SQL join/subquery, or (b) batch-count trigger_counts in a single query using `GROUP BY alert_id`.

### Issue 4: No Quote Caching — Every Request Hits Yahoo Finance
- **Root Cause:** `MarketDataService.get_quote()` (`backend/app/services/market_data_service.py:46`) calls `yf.Ticker(ticker).fast_info` on every invocation. Unlike `get_history()`, there is no database caching layer for quotes.
- **Severity:** High
- **Estimated Impact:** Every page that displays quotes (market data page, watchlist detail panel) must wait for a live Yahoo Finance call. Even repeated requests for the same ticker within seconds go to Yahoo Finance. Estimated latency: 500ms–3s per ticker.
- **Recommended Fix:** Add an in-memory or database cache for quotes with a short TTL (e.g., 60s). Use Redis or a simple `@lru_cache` with timeout. Even a 15-second in-memory cache would eliminate the vast majority of duplicate Yahoo calls.

### Issue 5: Duplicate API Requests from Context Pre-fetching
- **Root Cause:** `TickerProvider.setActiveTicker()` (`frontend/features/ticker/ticker-context.tsx:21`) pre-fetches signals, quote, and RSI data via `queryClient.prefetchQuery()`. Then, the page component's own hooks (e.g., `useQuoteQuery`, `useAnalyticsQueries`) fire identical queries. Results are deduplicated by React Query's query key hashing, but the fetches still happen concurrently (race condition on cache).
- **Severity:** Medium
- **Estimated Impact:** 2–4 redundant network requests per ticker navigation. On slow connections, this adds 2–8s of unnecessary waiting.
- **Recommended Fix:** Either remove pre-fetching from the ticker context and let page-level hooks manage fetching, or remove page-level hooks and consume pre-fetched data from the cache. The current approach does both.

### Issue 6: 30-Second Polling for Unread Notification Count on Every Page
- **Root Cause:** `useUnreadCountQuery()` in `frontend/features/notifications/hooks.ts:18` uses `refetchInterval: 30000`. This fires a backend API call every 30 seconds on every page where the sidebar is rendered.
- **Severity:** Medium
- **Estimated Impact:** This API call is cheap (small response, fast query), but it runs continuously even when the user is idle. Over an 8-hour session: ~960 unnecessary requests. Combined with all users, this creates background load for no benefit.
- **Recommended Fix:** Increase `refetchInterval` to 120s (minimum acceptable for notification badges), or use WebSocket/SSE for push-based updates. Alternatively, only poll when the window is focused.

### Issue 7: Analytics Page Makes 4 Separate API Calls per Ticker
- **Root Cause:** `useAnalyticsQueries()` (`frontend/features/analytics/hooks.ts:37`) calls 4 independent `useQuery` hooks for SMA, EMA, RSI, and MACD. Each hits a separate backend endpoint, and each backend endpoint calls `market_data_service.get_history()` independently.
- **Severity:** Medium
- **Estimated Impact:** Each analytics page load generates 4 HTTP requests to the backend, and each backend call may fetch history from Yahoo Finance. If history is uncached: ~8–12s total. If cached: ~800ms–1.2s for serialization + DB reads.
- **Recommended Fix:** Create a single batch endpoint (e.g., `GET /analytics/{ticker}/all`) that returns all indicators in one response. This reduces HTTP overhead and avoids redundant `get_history()` calls on the backend.

### Issue 8: Landing Page Loads All Sections Synchronously
- **Root Cause:** `app/page.tsx` imports and renders 12+ major components (Nav, Hero, SocialProof, LiveTicker, InteractiveShowcase, HowItWorks, CapabilitiesGrid, EvidenceSection, FutureVision, FAQ, FinalCTA, Footer) without any dynamic imports or lazy loading.
- **Severity:** Medium
- **Estimated Impact:** The landing page JavaScript bundle includes code for all 12+ sections, many of which may be below the fold. Estimated unused JS on first paint: 40–60%. Time-to-interactive (TTI) is delayed.
- **Recommended Fix:** Use `next/dynamic()` for components below the fold (FAQ, FinalCTA, FutureVision, EvidenceSection). This reduces initial bundle size and improves Core Web Vitals (LCP, FCP).

### Issue 9: Watchlist Detail Panel Re-fetches All Watchlists
- **Root Cause:** `WatchlistDetailPanel` (`frontend/components/watchlists/watchlist-detail-panel.tsx:25`) calls `useWatchlistsQuery()` which fetches ALL watchlists, then filters client-side. It only needs the single watchlist.
- **Severity:** Low
- **Estimated Impact:** For users with many watchlists, this fetches more data than needed. Overhead scales linearly with watchlist count.
- **Recommended Fix:** Add a dedicated `GET /watchlists/{id}` query hook that fetches only the needed watchlist, instead of re-fetching all watchlists and filtering client-side.

### Issue 10: No Production Build Optimizations
- **Root Cause:** `next.config.mjs` is empty (`frontend/next.config.mjs:2`). No bundle analyzer, no compiler flags, no image optimization configuration.
- **Severity:** Low
- **Estimated Impact:** In development mode, requests are 5–20x slower than production due to unminified code, hot module replacement, and no caching. The current `.env` has `DEBUG=true`, which disables FastAPI optimizations.
- **Recommended Fix:** Add production build optimizations to `next.config.mjs` (compiler, swcMinify, etc.), ensure `DEBUG=false` in production, and add `@next/bundle-analyzer` for monitoring bundle size.

---

## 3. Slowest API Endpoints

| Endpoint | Estimated Avg Latency | Primary Cost | Notes |
|---|---|---|---|
| `GET /watchlists/{id}/signals` | 10–30s | Yahoo Finance sequential calls (N tickers × ~1-3s) | Worst-case with 20 tickers |
| `GET /watchlists/{id}/quotes` | 5–20s | Yahoo Finance sequential calls (N tickers × ~0.5-1s) | Worst-case with 20 tickers |
| `GET /signals/{ticker}` | 2–5s | Yahoo Finance history fetch + indicator computation | Cached case: ~100ms |
| `GET /analytics/{ticker}/sma` | 1–4s | Yahoo Finance history fetch + SMA computation | Separate from other indicators |
| `GET /analytics/{ticker}/ema` | 1–4s | Yahoo Finance history fetch + EMA computation | Same history re-fetched |
| `GET /analytics/{ticker}/rsi` | 1–4s | Yahoo Finance history fetch + RSI computation | Same history re-fetched |
| `GET /analytics/{ticker}/macd` | 1–4s | Yahoo Finance history fetch + MACD computation | Same history re-fetched |
| `GET /market-data/quote/{ticker}` | 0.5–3s | Yahoo Finance fast_info call | No caching |
| `GET /market-data/history/{ticker}` | 0.1–3s | DB read (cached) or Yahoo Finance fetch | 7-day cache TTL |
| `GET /market-data/search?q=` | 0.3–2s | Yahoo Finance search API | LRU cached in-process |
| `GET /alerts` | 50–200ms | DB query + N+1 COUNT queries | Grows with alert count |
| `GET /watchlists` | 20–50ms | DB query with joinedload items | Fast |

**Note:** Latency estimates are based on code analysis and typical Yahoo Finance response times (500ms–3s). Actual numbers depend on network conditions and Yahoo Finance API performance.

---

## 4. React Query Findings

### Current Configuration
| Setting | Value | Found In |
|---|---|---|
| Default `staleTime` | 30s | `query-provider.tsx:10` |
| Default `retry` | 1 | `query-provider.tsx:11` |
| Default `refetchOnWindowFocus` | `false` | `query-provider.tsx:12` |
| Default `gcTime` | Not set (uses React Query v5 default = 5min) | Inherited |
| Auth `staleTime` | 5 min | `features/auth/context.tsx:38` |
| Market Data Quote `staleTime` | 60s | `features/market-data/hooks.ts:10` |
| Search `staleTime` | 5 min | `features/search/hooks.ts:28` |
| Search `gcTime` | 10 min | `features/search/hooks.ts:29` |
| Notifications `refetchInterval` | 30s | `features/notifications/hooks.ts:22` |

### Issues Identified

1. **Notification count polls aggressively:** `useUnreadCountQuery` uses `refetchInterval: 30000` (30 seconds). This runs on every authenticated page where the sidebar is rendered. Impact: ~960 unnecessary API calls per user per 8-hour session.

2. **Missing `gcTime` on watchlists and alerts:** Default garbage collection time (5 min) means navigating away from watchlists and coming back within 5 min will show cached data. This is fine, but increasing `staleTime` on watchlists (which change rarely) to 2–5 min would reduce refetches.

3. **Ticker context pre-fetching duplicates page-level fetches:** `setActiveTicker()` pre-fetches with `staleTime: 30000`, but then page hooks re-request the same data. React Query deduplicates via query keys, but the pre-fetch queryFn and page queryFn both execute before the cache is populated, causing redundant network calls.

4. **Auth `retry: false` is correct:** The auth endpoint correctly disables retry to avoid 401 loops.

5. **Search has appropriately long staleTime (5 min):** Good — search results don't change frequently.

---

## 5. Database Findings

### Current Schema
- Tables: `market_data`, `watchlists`, `watchlist_items`, `users`, `alerts`, `triggered_alerts`, `notifications`, `refresh_tokens`, `trades`
- Indexes: `ix_market_data_ticker_date` (composite), `ix_market_data_ticker`, appropriate FK indexes
- Constraints: `uq_market_data_ticker_date` (unique on ticker+date)

### Issues Identified

1. **No connection pooling configuration beyond defaults:** `create_engine()` in `db/session.py:10` uses default pool size (5) and no pool overflow. Under load, requests will queue waiting for connections. **Estimated impact:** Connection starvation under concurrent load >5 requests.

2. **N+1 query on `GET /alerts` endpoint:** `AlertService.list_alerts()` + per-alert `get_trigger_count()`. Fix: add a subquery join or use `COUNT` with `GROUP BY`.

3. **Market data upsert uses individual SELECT per row:** `MarketDataRepository.upsert_rows()` (`repositories/market_data_repository.py:34`) loops through rows and does a `SELECT` for each before inserting/updating. For a history fetch with 200 bars, this means 200 individual SELECT queries. Fix: use PostgreSQL `ON CONFLICT` upsert.

4. **Watchlist list uses joinedload:** `WatchlistRepository.list_for_user()` eagerly loads items. This is correct — it prevents N+1 when rendering watchlist cards with item counts.

5. **No pagination on market data history:** `get_history()` returns all rows for a ticker (potentially thousands for "max" period). The response includes all bars. For a multi-year dataset with daily bars, this could be 1000+ rows. **Estimated impact:** Large JSON serialization payload (1000+ objects).

---

## 6. Yahoo Finance Findings

### Key Observations

1. **Every quote request hits Yahoo Finance live:** `get_quote()` in `market_data_service.py:46` makes a live call to `yf.Ticker(ticker).fast_info` on every invocation. No caching layer. **Estimated latency:** 500ms–3s per ticker.

2. **History has caching but with 7-day TTL:** `get_history()` uses database caching, but `market_data_cache_days = 7` means cached data may be up to 7 days stale. For daily data this is reasonable, but for "1d" or "5d" periods, users will see stale prices. **Estimated impact:** Users requesting short periods may get cached data from days ago.

3. **Search uses in-process LRU cache:** `search_tickers()` in `search_service.py:23` uses `@lru_cache(maxsize=256)`. This only caches within a single worker process. With multiple workers (e.g., gunicorn with 4 workers), each has its own cache. Cache invalidation is manual.

4. **Sequential ticker processing compounds latency:** Both `get_watchlist_quotes()` and `get_watchlist_signals()` process tickers in sequence, multiplying Yahoo Finance latency by the ticker count.

5. **No rate limiting on Yahoo Finance calls:** The backend has rate limiting for login but not for external API calls. If many tickers are requested simultaneously, Yahoo Finance may return 429 or start throttling.

### Estimated Yahoo Finance Latency Contribution

| Scenario | Yahoo Calls | Estimated Total Latency |
|---|---|---|
| Single ticker quote | 1 call | 0.5–3s |
| Watchlist with 10 ticker quotes | 10 calls (sequential) | 5–30s |
| Watchlist signals (10 tickers) | 10 history calls | 10–30s |
| Analytics page (4 indicators) | 4 history calls (if uncached) | 4–12s |
| Alert evaluation (10 tickers) | 10 quote/history calls | 5–30s |

**Total estimated Yahoo Finance latency per user session:** 30–120s if navigating through multiple pages with uncached data.

---

## 7. Quick Wins (High Impact, Low Effort)

### QW1: Parallelize Watchlist Quote Fetching
- **File:** `backend/app/services/watchlist_service.py`
- **Change:** Replace the sequential for-loop for quote fetching with `concurrent.futures.ThreadPoolExecutor(max_workers=5)`.
- **Estimated improvement:** 10–20x faster for watchlists with multiple tickers.

### QW2: Add In-Memory Quote Cache
- **File:** `backend/app/services/market_data_service.py`
- **Change:** Add a `@lru_cache` with TTL (e.g., `cachetools.TTLCache(maxsize=256, ttl=60)`) to `get_quote()` to avoid hitting Yahoo Finance for repeated requests.
- **Estimated improvement:** Eliminates 80–90% of quote API calls.

### QW3: Eliminate N+1 on Alerts Endpoint
- **File:** `backend/app/api/v1/routes/alerts.py`
- **Change:** Add a subquery to the alert listing query that joins `triggered_alerts` with a `COUNT` aggregation.
- **Estimated improvement:** Reduces alerts endpoint from O(N) queries to O(1).

### QW4: Increase Notification Poll Interval
- **File:** `frontend/features/notifications/hooks.ts`
- **Change:** Change `refetchInterval: 30000` to `refetchInterval: 120000` (2 minutes).
- **Estimated improvement:** Reduces background API load by 75%.

### QW5: Batch RSI Pre-fetch Removal from TickerContext
- **File:** `frontend/features/ticker/ticker-context.tsx`
- **Change:** Remove the `queryClient.prefetchQuery` calls for RSI, signals, and quote. Let page-level hooks manage their own fetching.
- **Estimated improvement:** Eliminates 2–4 duplicate network requests per ticker navigation.

### QW6: Reduce Alert Evaluation Interval During Market Hours
- **File:** `backend/app/services/scheduler.py`
- **Change:** Change `IntervalTrigger(minutes=5)` to `IntervalTrigger(minutes=1)` during market hours for more responsive alerts. Or keep 5min — it's already acceptable.
- **Estimated improvement:** Not a performance fix per se, but recommended for functionality.

---

## 8. Long-Term Optimizations

### LT1: Redis Caching Layer
- Add Redis for server-side caching of Yahoo Finance quotes (60s TTL), history (configurable TTL per period), and search results (5min TTL).
- **Estimated improvement:** Eliminates all duplicate Yahoo Finance calls. 5–10x improvement across all data-heavy pages.

### LT2: Async Parallelization of Yahoo Finance Calls
- Refactor all ticker-related services (`watchlist_service`, `signal_service`, `market_data_service`) to use `asyncio` with `httpx.AsyncClient` instead of synchronous yfinance calls.
- **Current blocker:** `yfinance` is synchronous. Switch to direct `httpx` calls to Yahoo Finance REST APIs.
- **Estimated improvement:** 10–20x speedup for multi-ticker operations.

### LT3: Single Analytics Batch Endpoint
- Create `GET /analytics/{ticker}/all` returning all indicators in one response. This avoids 4 separate `get_history()` calls and 4 separate HTTP round-trips.
- **Estimated improvement:** Reduces analytics page load from 4 requests (8–12s) to 1 request (2–5s).

### LT4: WebSocket for Real-Time Data
- Replace notification polling with WebSocket-based push. This eliminates all background polling requests.
- **Estimated improvement:** Zero background API load for notifications.

### LT5: Server-Side Data Loading with React Server Components
- Convert dashboard pages from "use client" to server components where possible. Fetch data during SSR/SSG to reduce client-side waterfally.
- **Estimated improvement:** Faster initial page loads (eliminate client-side loading spinners).

### LT6: Bundle Size Optimization
- Add code splitting with `next/dynamic()` for landing page sections.
- Add `@next/bundle-analyzer` to identify large dependencies.
- Consider tree-shaking `recharts` imports or switching to a lighter charting library.
- **Estimated improvement:** 30–50% reduction in initial JS bundle size.

### LT7: PostgreSQL ON CONFLICT Upsert
- Replace individual SELECT-then-INSERT/UPDATE pattern in `MarketDataRepository.upsert_rows()` with a single bulk upsert using SQLAlchemy's `postgresql.on_conflict_do_update`.
- **Estimated improvement:** Reduces history save time from O(N) queries to O(1).

---

## 9. Estimated Overall Performance Improvement Potential

| Optimization | Pages Affected | Est. Speedup | Effort |
|---|---|---|---|
| Parallelize Yahoo Finance calls | Watchlists, Signals | 10–20x | Medium |
| Add quote caching | Market Data, Watchlists | 5–10x | Low |
| Eliminate N+1 alerts | Alerts page | 2–5x | Low |
| Single analytics endpoint | Analytics page | 2–4x | Medium |
| Increase poll interval | All pages | 75% fewer requests | Trivial |
| Remove duplicate pre-fetches | All dashboard pages | 2–4 fewer requests | Low |
| Redis caching layer | All data pages | 5–10x | High |
| Async Yahoo Finance | All data pages | 10–20x | High |
| Bundle optimization | Landing page | 30–50% smaller JS | Medium |

**Composite estimated improvement for a typical user flow (navigate to dashboard → open watchlist with 10 tickers → view analytics):**

- **Before:** ~30–45s total load time
- **After Quick Wins (QW1–QW5):** ~5–10s total load time (3–5x improvement)
- **After Long-Term (LT1–LT3):** ~2–5s total load time (10–20x improvement)

### Key Takeaway

The single highest-impact change is **parallelizing Yahoo Finance calls** when fetching data for multiple tickers simultaneously (Quick Win QW1). This alone can reduce watchlist and signal page load times from 20–30 seconds down to 2–5 seconds. Combined with in-memory quote caching (QW2), this addresses 80%+ of user-facing latency.
