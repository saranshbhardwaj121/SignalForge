import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { getQuote } from "@/features/market-data/api";

export function useQuoteQuery(ticker: string | null) {
  return useQuery({
    queryKey: queryKeys.marketData.quote(ticker ?? ""),
    queryFn: () => getQuote(ticker!),
    enabled: !!ticker,
    staleTime: 60_000,
  });
}
