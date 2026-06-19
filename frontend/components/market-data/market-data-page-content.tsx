"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketDataSearchForm } from "@/components/market-data/market-data-search-form";
import { MarketDataEmptyState } from "@/components/market-data/market-data-empty-state";
import { MarketDataSkeleton } from "@/components/market-data/market-data-skeleton";
import { MarketDataErrorState } from "@/components/market-data/market-data-error-state";
import { MarketDataQuoteDisplay } from "@/components/market-data/market-data-quote-display";
import { useQuoteQuery } from "@/features/market-data/hooks";

export function MarketDataPageContent() {
  const [activeTicker, setActiveTicker] = React.useState<string | null>(null);
  const query = useQuoteQuery(activeTicker);
  const isFirstLoad = activeTicker !== null && query.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Data</h1>
          <p className="text-muted-foreground">
            {activeTicker
              ? `Real-time quote for ${activeTicker}`
              : "Look up real-time market data for any ticker"}
          </p>
        </div>
        {activeTicker && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      <MarketDataSearchForm onSearch={setActiveTicker} isLoading={isFirstLoad} />

      {!activeTicker ? (
        <MarketDataEmptyState />
      ) : query.isLoading ? (
        <MarketDataSkeleton />
      ) : query.isError ? (
        <MarketDataErrorState
          message={query.error?.message || "Failed to load quote"}
          onRetry={() => query.refetch()}
        />
      ) : query.data ? (
        <MarketDataQuoteDisplay data={query.data} />
      ) : null}
    </div>
  );
}
