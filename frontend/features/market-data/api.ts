import { clientFetch } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { Quote } from "@/features/market-data/types";

export async function getQuote(ticker: string): Promise<Quote> {
  return clientFetch<Quote>(API_ROUTES.MARKET_DATA.QUOTE(ticker));
}
