import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { getSma, getEma, getRsi, getMacd } from "@/features/analytics/api";

export function useSmaQuery(ticker: string | null) {
  return useQuery({
    queryKey: queryKeys.analytics.sma(ticker ?? ""),
    queryFn: () => getSma(ticker!),
    enabled: !!ticker,
  });
}

export function useEmaQuery(ticker: string | null) {
  return useQuery({
    queryKey: queryKeys.analytics.ema(ticker ?? ""),
    queryFn: () => getEma(ticker!),
    enabled: !!ticker,
  });
}

export function useRsiQuery(ticker: string | null) {
  return useQuery({
    queryKey: queryKeys.analytics.rsi(ticker ?? ""),
    queryFn: () => getRsi(ticker!),
    enabled: !!ticker,
  });
}

export function useMacdQuery(ticker: string | null) {
  return useQuery({
    queryKey: queryKeys.analytics.macd(ticker ?? ""),
    queryFn: () => getMacd(ticker!),
    enabled: !!ticker,
  });
}

export function useAnalyticsQueries(ticker: string | null) {
  const smaQuery = useSmaQuery(ticker);
  const emaQuery = useEmaQuery(ticker);
  const rsiQuery = useRsiQuery(ticker);
  const macdQuery = useMacdQuery(ticker);

  const isFetching =
    smaQuery.isFetching ||
    emaQuery.isFetching ||
    rsiQuery.isFetching ||
    macdQuery.isFetching;

  const refetchAll = () => {
    smaQuery.refetch();
    emaQuery.refetch();
    rsiQuery.refetch();
    macdQuery.refetch();
  };

  return { smaQuery, emaQuery, rsiQuery, macdQuery, isFetching, refetchAll };
}
