"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Quote } from "@/features/market-data/types";

interface MarketDataQuoteDisplayProps {
  data: Quote;
}

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "--";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatVolume(value: number | null | undefined): string {
  if (value == null) return "--";
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatMarketCap(value: number | null | undefined): string {
  if (value == null) return "--";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

export function MarketDataQuoteDisplay({ data }: MarketDataQuoteDisplayProps) {
  const priceChange = data.price != null && data.previous_close != null
    ? data.price - data.previous_close
    : null;
  const changePercent = priceChange != null && data.previous_close != null && data.previous_close !== 0
    ? (priceChange / data.previous_close) * 100
    : null;

  const isPositive = priceChange != null && priceChange >= 0;
  const changeClass = priceChange == null ? "text-muted-foreground" : isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{data.ticker}</span>
            {data.name && (
              <span className="text-sm text-muted-foreground">{data.name}</span>
            )}
            {data.exchange && (
              <Badge variant="outline" className="text-xs font-normal">{data.exchange}</Badge>
            )}
          </div>
          {data.currency && (
            <Badge variant="secondary" className="text-xs font-normal">{data.currency}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-3xl font-bold tabular-nums">
            {data.price != null ? `${data.currency || ""} ${formatPrice(data.price)}` : "--"}
          </span>
          {priceChange != null && (
            <span className={`text-lg font-medium tabular-nums ${changeClass}`}>
              {isPositive ? "+" : ""}{formatPrice(priceChange)}
              {changePercent != null && ` (${isPositive ? "+" : ""}${changePercent.toFixed(2)}%)`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Previous Close</p>
            <p className="text-sm font-medium tabular-nums">{formatPrice(data.previous_close)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Open</p>
            <p className="text-sm font-medium tabular-nums">{formatPrice(data.open)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Day High</p>
            <p className="text-sm font-medium tabular-nums">{formatPrice(data.day_high)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Day Low</p>
            <p className="text-sm font-medium tabular-nums">{formatPrice(data.day_low)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume</p>
            <p className="text-sm font-medium tabular-nums">{formatVolume(data.volume)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="text-sm font-medium tabular-nums">{formatMarketCap(data.market_cap)}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          {data.provider} &middot; {new Date(data.fetched_at).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
