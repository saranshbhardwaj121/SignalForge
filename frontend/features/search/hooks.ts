"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { searchTickers } from "./api";
import type { SearchResultItem } from "./types";

export function useSearchDebounce(value: string, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useTickerSearchQuery(query: string) {
  const debouncedQuery = useSearchDebounce(query, 300);
  const enabled = debouncedQuery.trim().length >= 1;

  const result = useQuery({
    queryKey: queryKeys.marketData.search(debouncedQuery),
    queryFn: () => searchTickers(debouncedQuery),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const suggestions: SearchResultItem[] = result.data?.results ?? [];

  return {
    ...result,
    suggestions,
    isSearching: enabled && result.isFetching,
    hasSearched: enabled && !result.isLoading,
  };
}
