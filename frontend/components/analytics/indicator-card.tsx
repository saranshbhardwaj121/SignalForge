"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCardSkeleton } from "@/components/analytics/analytics-skeleton";
import { AnalyticsCardErrorState } from "@/components/analytics/analytics-error-state";
import type { IndicatorResponse } from "@/features/analytics/types";

type IndicatorType = "rsi" | "sma" | "ema";

interface IndicatorCardProps {
  title: string;
  type: IndicatorType;
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

function getInterpretation(type: IndicatorType, latest: { value: number | null; close: number }): { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string } {
  if (latest.value == null) {
    return { label: "No data", variant: "outline", className: "" };
  }

  if (type === "rsi") {
    if (latest.value <= 30) return { label: "Oversold", variant: "default", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800" };
    if (latest.value >= 70) return { label: "Overbought", variant: "destructive", className: "" };
    return { label: "Neutral", variant: "secondary", className: "" };
  }

  if (type === "sma" || type === "ema") {
    const diff = latest.close - latest.value;
    if (diff > latest.value * 0.01) return { label: "Uptrend", variant: "default", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800" };
    if (diff < -latest.value * 0.01) return { label: "Downtrend", variant: "destructive", className: "" };
    return { label: "Neutral", variant: "secondary", className: "" };
  }

  return { label: "Neutral", variant: "secondary", className: "" };
}

export function IndicatorCard({ title, type, query }: IndicatorCardProps) {
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

  const interpretation = getInterpretation(type, data.latest);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
