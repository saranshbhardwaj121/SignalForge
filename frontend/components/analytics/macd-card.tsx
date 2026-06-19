"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnalyticsCardSkeleton } from "@/components/analytics/analytics-skeleton";
import { AnalyticsCardErrorState } from "@/components/analytics/analytics-error-state";
import type { MacdResponse } from "@/features/analytics/types";

interface MacdCardProps {
  query: {
    data: MacdResponse | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => void;
  };
}

function formatValue(value: number | null | undefined): string {
  if (value == null) return "--";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MacdCard({ query }: MacdCardProps) {
  const { data, isLoading, isError, error, refetch } = query;

  if (isLoading) {
    return <AnalyticsCardSkeleton />;
  }

  if (isError) {
    return (
      <AnalyticsCardErrorState
        message={error?.message || "Failed to load MACD"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || !data.latest) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">No MACD data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">MACD</CardTitle>
        {data.cached && (
          <Badge variant="outline" className="text-xs font-normal">Cached</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">MACD Line</span>
            <span className="text-sm font-medium tabular-nums">{formatValue(data.latest.macd)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Signal Line</span>
            <span className="text-sm font-medium tabular-nums">{formatValue(data.latest.signal)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Histogram</span>
            <span className="text-sm font-medium tabular-nums">{formatValue(data.latest.histogram)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Close: {formatValue(data.latest.close)} &middot; {data.latest.date}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Fast: {data.parameters.fast} Slow: {data.parameters.slow} Signal: {data.parameters.signal}</span>
          <span>{data.provider}</span>
          <span>{new Date(data.fetched_at).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
