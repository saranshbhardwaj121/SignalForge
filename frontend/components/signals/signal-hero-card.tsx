"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfidenceGauge } from "@/components/charts/confidence-gauge";
import type { SignalSummary } from "@/features/signals/types";

interface SignalHeroCardProps {
  data: SignalSummary;
}

function getConfidenceLabel(value: number): string {
  if (value >= 0.5) return "Strong";
  if (value >= 0.3) return "Moderate";
  return "Weak";
}

function getAgreementCount(data: SignalSummary): number {
  const nonNeutral = data.signals.filter((s) => s.action !== "NEUTRAL");
  return nonNeutral.length;
}

function getSummarySentence(data: SignalSummary): string {
  const agreementCount = getAgreementCount(data);
  const total = data.signals.length;
  const label = getConfidenceLabel(data.confidence);
  const rating = data.rating === "BUY" ? "buy" : data.rating === "SELL" ? "sell" : "neutral";

  if (data.rating === "NEUTRAL") {
    return `Neutral signal — ${total - agreementCount} of ${total} indicators are neutral`;
  }

  if (agreementCount === total) {
    return `${label} ${rating} signal — all ${total} indicators agree`;
  }

  return `${label} ${rating} signal — ${agreementCount} of ${total} indicators agree`;
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

        <p className="text-sm mt-4 max-w-md text-muted-foreground">
          {getSummarySentence(data)}
        </p>

        <div className="flex items-center gap-8 mt-4">
          <ConfidenceGauge value={data.confidence} rating={data.rating} size={96} />
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
