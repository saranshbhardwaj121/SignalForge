"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnalyticsCardSkeleton } from "@/components/analytics/analytics-skeleton";
import { AnalyticsCardErrorState } from "@/components/analytics/analytics-error-state";
import { MacdChart } from "@/components/charts/macd-chart";
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

function getMacdInterpretation(latest: { macd: number | null; signal: number | null }): { label: string; className: string } {
  if (latest.macd == null || latest.signal == null) {
    return { label: "No data", className: "" };
  }

  if (latest.macd > latest.signal) return { label: "Bullish Crossover", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800" };
  if (latest.macd < latest.signal) return { label: "Bearish Crossover", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100" };
  return { label: "Neutral", className: "bg-muted text-muted-foreground" };
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

  const interpretation = getMacdInterpretation(data.latest);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">MACD</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs font-normal ${interpretation.className}`}>
            {interpretation.label}
          </Badge>
          {data.cached && (
            <Badge variant="outline" className="text-xs font-normal">Cached</Badge>
          )}
        </div>
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
        {data.rows && data.rows.length > 0 && (
          <div className="mt-3 mb-2">
            <MacdChart data={data.rows} />
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
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
