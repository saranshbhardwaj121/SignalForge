"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SignalSummary } from "@/features/signals/types";

interface SignalHeroCardProps {
  data: SignalSummary;
}

function formatConfidence(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function SignalHeroCard({ data }: SignalHeroCardProps) {
  const isBuy = data.rating === "BUY";
  const isSell = data.rating === "SELL";

  const badgeClass = isBuy
    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800"
    : isSell
    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200 dark:border-red-800"
    : "bg-muted text-muted-foreground border-border";

  const borderClass = isBuy
    ? "border-green-200 dark:border-green-900"
    : isSell
    ? "border-red-200 dark:border-red-900"
    : "";

  return (
    <Card className={`border-2 ${borderClass}`}>
      <CardContent className="flex flex-col items-center py-8 text-center">
        <Badge
          className={`text-base px-4 py-1.5 uppercase tracking-wider border ${badgeClass}`}
        >
          {data.rating}
        </Badge>
        <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
          Signal
        </span>

        <div className="flex items-center gap-8 mt-5">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums">
              {formatConfidence(data.confidence)}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">Confidence</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-semibold tabular-nums text-muted-foreground">
              {Math.abs(data.score)}/6
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">Score</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{data.ticker}</span>
          <span>{data.period}</span>
          <span>{data.interval}</span>
          {data.cached && <span>Cached</span>}
          <span>
            Updated {new Date(data.fetched_at).toLocaleTimeString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
