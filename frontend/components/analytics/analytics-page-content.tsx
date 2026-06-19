"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsSearchForm } from "@/components/analytics/analytics-search-form";
import { AnalyticsEmptyState } from "@/components/analytics/analytics-empty-state";
import { IndicatorCard } from "@/components/analytics/indicator-card";
import { MacdCard } from "@/components/analytics/macd-card";
import { useAnalyticsQueries } from "@/features/analytics/hooks";

export function AnalyticsPageContent() {
  const [activeTicker, setActiveTicker] = React.useState<string | null>(null);
  const queries = useAnalyticsQueries(activeTicker);
  const isFirstLoad = activeTicker !== null && queries.smaQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            {activeTicker
              ? `Technical indicators for ${activeTicker}`
              : "View technical indicators for any ticker"}
          </p>
        </div>
        {activeTicker && (
          <Button
            variant="outline"
            size="sm"
            onClick={queries.refetchAll}
            disabled={queries.isFetching}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${queries.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        )}
      </div>

      <AnalyticsSearchForm onSearch={setActiveTicker} isLoading={isFirstLoad} />

      {!activeTicker ? (
        <AnalyticsEmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <IndicatorCard title="RSI (14)" query={queries.rsiQuery} />
          <IndicatorCard title="SMA (20)" query={queries.smaQuery} />
          <IndicatorCard title="EMA (20)" query={queries.emaQuery} />
          <MacdCard query={queries.macdQuery} />
        </div>
      )}
    </div>
  );
}
