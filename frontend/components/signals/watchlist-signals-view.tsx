"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SignalTickerRowCard } from "@/components/signals/signal-ticker-row-card";
import { SignalDistributionChart } from "@/components/charts/signal-distribution-chart";
import { SignalsWatchlistSkeleton } from "@/components/signals/signals-skeleton";
import { SignalsErrorState } from "@/components/signals/signals-error-state";
import { useWatchlistsQuery } from "@/features/watchlists/hooks";
import type { WatchlistSignalsResponse } from "@/features/signals/types";

interface WatchlistSignalsViewProps {
  selectedWatchlistId: string | null;
  onSelectWatchlist: (id: string | null) => void;
  query: {
    data: WatchlistSignalsResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

export function WatchlistSignalsView({
  selectedWatchlistId,
  onSelectWatchlist,
  query,
}: WatchlistSignalsViewProps) {
  const { data: watchlists, isLoading: isLoadingWatchlists } = useWatchlistsQuery();

  if (isLoadingWatchlists) {
    return <SignalsWatchlistSkeleton />;
  }

  return (
    <div className="space-y-4">
      {watchlists && watchlists.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {watchlists.map((wl) => (
            <button
              key={wl.id}
              onClick={() => onSelectWatchlist(wl.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                selectedWatchlistId === wl.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {wl.name}
            </button>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No watchlists yet. Create one to view signals.
            </p>
          </CardContent>
        </Card>
      )}

      {!selectedWatchlistId ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {watchlists && watchlists.length > 0
              ? "Select a watchlist to view signals"
              : "Create a watchlist with tickers to get started"}
          </p>
        </div>
      ) : query.isLoading ? (
        <SignalsWatchlistSkeleton />
      ) : query.isError ? (
        <SignalsErrorState
          message={query.error?.message || "Failed to load signals"}
          onRetry={() => query.refetch()}
        />
      ) : query.data ? (
        <div className="space-y-4">
          {query.data.signals.length > 0 && (
            <SignalDistributionChart signals={query.data.signals} />
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {query.data.generated_at
                ? `Generated ${new Date(query.data.generated_at).toLocaleTimeString()}`
                : ""}
            </p>
          </div>
          {query.data.signals.length > 0 ? (
            <div className="space-y-2">
              {query.data.signals.map((item) => (
                <SignalTickerRowCard key={item.ticker} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No signals available
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
