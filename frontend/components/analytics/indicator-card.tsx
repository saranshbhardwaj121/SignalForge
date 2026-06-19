"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCardSkeleton } from "@/components/analytics/analytics-skeleton";
import { AnalyticsCardErrorState } from "@/components/analytics/analytics-error-state";
import type { IndicatorResponse } from "@/features/analytics/types";

interface IndicatorCardProps {
  title: string;
  query: {
    data: IndicatorResponse | undefined;
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

export function IndicatorCard({ title, query }: IndicatorCardProps) {
  const { data, isLoading, isError, error, refetch } = query;

  if (isLoading) {
    return <AnalyticsCardSkeleton />;
  }

  if (isError) {
    return (
      <AnalyticsCardErrorState
        message={error?.message || "Failed to load indicator"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data || !data.latest) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">No data available for this indicator</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {data.cached && (
          <Badge variant="outline" className="text-xs font-normal">Cached</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">
          {formatValue(data.latest.value)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Close: {formatValue(data.latest.close)} &middot; {data.latest.date}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {Object.entries(data.parameters).map(([key, value]) => (
            <span key={key} className="capitalize">{key}: {value}</span>
          ))}
          <span>{data.provider}</span>
          <span>{new Date(data.fetched_at).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
