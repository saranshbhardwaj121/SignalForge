import { clientFetch } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { Watchlist, WatchlistQuotesResponse } from "@/features/watchlists/types";

export async function listWatchlists(): Promise<Watchlist[]> {
  return clientFetch<Watchlist[]>(API_ROUTES.WATCHLISTS.LIST);
}

export async function getWatchlist(id: string): Promise<Watchlist> {
  return clientFetch<Watchlist>(API_ROUTES.WATCHLISTS.DETAIL(id));
}

export async function createWatchlist(name: string): Promise<Watchlist> {
  return clientFetch<Watchlist>(API_ROUTES.WATCHLISTS.CREATE, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteWatchlist(id: string): Promise<void> {
  await clientFetch<void>(API_ROUTES.WATCHLISTS.DELETE(id), {
    method: "DELETE",
  });
}

export async function addTicker(watchlistId: string, ticker: string): Promise<Watchlist> {
  return clientFetch<Watchlist>(API_ROUTES.WATCHLISTS.ADD_TICKER(watchlistId), {
    method: "POST",
    body: JSON.stringify({ ticker }),
  });
}

export async function removeTicker(watchlistId: string, ticker: string): Promise<void> {
  await clientFetch<void>(API_ROUTES.WATCHLISTS.REMOVE_TICKER(watchlistId, ticker), {
    method: "DELETE",
  });
}

export async function getWatchlistQuotes(watchlistId: string): Promise<WatchlistQuotesResponse> {
  return clientFetch<WatchlistQuotesResponse>(API_ROUTES.WATCHLISTS.QUOTES(watchlistId));
}
