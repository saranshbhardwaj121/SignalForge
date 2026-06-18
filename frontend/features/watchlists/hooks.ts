import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/api/query-keys";
import {
  listWatchlists,
  createWatchlist,
  deleteWatchlist,
  addTicker,
  removeTicker,
  getWatchlistQuotes,
} from "@/features/watchlists/api";
import type { Watchlist } from "@/features/watchlists/types";

export function useWatchlistsQuery() {
  return useQuery({
    queryKey: queryKeys.watchlists.all,
    queryFn: listWatchlists,
  });
}

export function useWatchlistQuotesQuery(watchlistId: string | null) {
  return useQuery({
    queryKey: queryKeys.watchlists.quotes(watchlistId ?? ""),
    queryFn: () => getWatchlistQuotes(watchlistId!),
    enabled: !!watchlistId,
  });
}

export function useCreateWatchlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createWatchlist(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.all });
      toast.success("Watchlist created");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create watchlist");
    },
  });
}

export function useDeleteWatchlistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.all });
      toast.success("Watchlist deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete watchlist");
    },
  });
}

export function useAddTickerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ watchlistId, ticker }: { watchlistId: string; ticker: string }) =>
      addTicker(watchlistId, ticker),
    onSuccess: (data: Watchlist) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.quotes(data.id) });
      toast.success("Ticker added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add ticker");
    },
  });
}

export function useRemoveTickerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ watchlistId, ticker }: { watchlistId: string; ticker: string }) =>
      removeTicker(watchlistId, ticker),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.detail(variables.watchlistId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.watchlists.quotes(variables.watchlistId) });
      toast.success("Ticker removed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove ticker");
    },
  });
}
