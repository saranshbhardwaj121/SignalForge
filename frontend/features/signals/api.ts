import { clientFetch } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { SignalSummary, WatchlistSignalsResponse } from "@/features/signals/types";

export async function getTickerSignal(ticker: string): Promise<SignalSummary> {
  return clientFetch<SignalSummary>(API_ROUTES.SIGNALS.TICKER(ticker));
}

export async function getWatchlistSignals(watchlistId: string): Promise<WatchlistSignalsResponse> {
  return clientFetch<WatchlistSignalsResponse>(API_ROUTES.WATCHLISTS.SIGNALS(watchlistId));
}
