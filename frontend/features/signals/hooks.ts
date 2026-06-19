import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { getTickerSignal, getWatchlistSignals } from "@/features/signals/api";

export function useTickerSignalQuery(ticker: string | null) {
  return useQuery({
    queryKey: queryKeys.signals.ticker(ticker ?? ""),
    queryFn: () => getTickerSignal(ticker!),
    enabled: !!ticker,
  });
}

export function useWatchlistSignalsQuery(watchlistId: string | null) {
  return useQuery({
    queryKey: queryKeys.watchlists.signals(watchlistId ?? ""),
    queryFn: () => getWatchlistSignals(watchlistId!),
    enabled: !!watchlistId,
  });
}
