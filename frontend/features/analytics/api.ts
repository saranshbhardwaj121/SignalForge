import { clientFetch } from "@/lib/api/client";
import { API_ROUTES } from "@/lib/api/routes";
import type { IndicatorResponse, MacdResponse } from "@/features/analytics/types";

export async function getSma(ticker: string): Promise<IndicatorResponse> {
  return clientFetch<IndicatorResponse>(API_ROUTES.ANALYTICS.SMA(ticker));
}

export async function getEma(ticker: string): Promise<IndicatorResponse> {
  return clientFetch<IndicatorResponse>(API_ROUTES.ANALYTICS.EMA(ticker));
}

export async function getRsi(ticker: string): Promise<IndicatorResponse> {
  return clientFetch<IndicatorResponse>(API_ROUTES.ANALYTICS.RSI(ticker));
}

export async function getMacd(ticker: string): Promise<MacdResponse> {
  return clientFetch<MacdResponse>(API_ROUTES.ANALYTICS.MACD(ticker));
}
