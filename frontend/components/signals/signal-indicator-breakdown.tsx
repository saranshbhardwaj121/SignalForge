"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SignalDetail } from "@/features/signals/types";

interface SignalIndicatorBreakdownProps {
  detail: SignalDetail;
}

function formatIndicatorName(name: string): string {
  const map: Record<string, string> = {
    rsi: "RSI",
    macd: "MACD",
    sma_trend: "SMA Trend",
    ema_trend: "EMA Trend",
  };
  return map[name] || name;
}

function formatReason(reason: string): string {
  return reason
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatConfidence(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "--";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function SignalIndicatorBreakdown({ detail }: SignalIndicatorBreakdownProps) {
  const isBuy = detail.action === "BUY";
  const isSell = detail.action === "SELL";

  const badgeClass = isBuy
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    : isSell
    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    : "bg-muted text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {formatIndicatorName(detail.name)}
        </CardTitle>
        <Badge className={badgeClass}>{detail.action}</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-muted-foreground">
            Score: {detail.score}
          </span>
          <span className="text-sm font-medium tabular-nums">
            {formatConfidence(detail.confidence)}
          </span>
        </div>
        <p className="text-sm">{formatReason(detail.reason)}</p>
        {detail.close != null && detail.signal_date && (
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Close: {formatPrice(detail.close)}</span>
            <span>{detail.signal_date}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
