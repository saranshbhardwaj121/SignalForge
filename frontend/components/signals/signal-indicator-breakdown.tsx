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

function getFluentExplanation(detail: SignalDetail): string {
  const name = detail.name;
  const metadata = detail.metadata || {};
  const close = detail.close;
  const value = (metadata as Record<string, unknown>).value as number | undefined;

  if (name === "rsi") {
    switch (detail.reason) {
      case "strong_oversold":
        return `RSI at ${value?.toFixed(1) ?? "--"} — deep oversold territory, strong bounce potential`;
      case "oversold":
        return `RSI at ${value?.toFixed(1) ?? "--"} — oversold territory, potential bounce`;
      case "strong_overbought":
        return `RSI at ${value?.toFixed(1) ?? "--"} — deep overbought territory, strong pullback risk`;
      case "overbought":
        return `RSI at ${value?.toFixed(1) ?? "--"} — overbought territory, potential pullback`;
      default:
        return `RSI at ${value?.toFixed(1) ?? "--"} — neutral range`;
    }
  }

  if (name === "macd") {
    switch (detail.reason) {
      case "bullish_crossover":
        return "MACD line crossed above signal line — bullish momentum building";
      case "bearish_crossover":
        return "MACD line crossed below signal line — bearish momentum building";
      default:
        return "No clear MACD crossover signal";
    }
  }

  if (name === "sma_trend" || name === "ema_trend") {
    const indicator = name === "sma_trend" ? "SMA" : "EMA";
    if (close != null && value != null) {
      const diff = ((close - value) / value) * 100;
      const direction = close > value ? "above" : "below";
      const signal = close > value ? "bullish" : "bearish";
      return `Price (${formatPrice(close)}) is ${direction} the ${indicator} (${formatPrice(value)}) — ${signal} trend, ${Math.abs(diff).toFixed(1)}% deviation`;
    }
    return `${indicator} trend direction not available`;
  }

  return detail.reason
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function SignalIndicatorBreakdown({ detail }: SignalIndicatorBreakdownProps) {
  const isBuy = detail.action === "BUY";
  const isSell = detail.action === "SELL";
  const confidencePercent = (detail.confidence * 100).toFixed(0);

  const badgeClass = isBuy
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    : isSell
    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    : "bg-muted text-muted-foreground";

  const barColor = isBuy
    ? "bg-green-500 dark:bg-green-400"
    : isSell
    ? "bg-red-500 dark:bg-red-400"
    : "bg-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {formatIndicatorName(detail.name)}
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <Badge className={badgeClass}>{detail.action}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{getFluentExplanation(detail)}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-muted-foreground">
            Score: {detail.score} &middot; Confidence: {formatConfidence(detail.confidence)}
          </span>
        </div>
        {detail.close != null && detail.signal_date && (
          <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
            <span>Close: {formatPrice(detail.close)}</span>
            <span>{detail.signal_date}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
