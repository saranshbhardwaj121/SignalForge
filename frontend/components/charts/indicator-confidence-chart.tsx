"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import type { SignalDetail } from "@/features/signals/types";

interface IndicatorConfidenceChartProps {
  signals: SignalDetail[];
}

function formatIndicatorName(name: string): string {
  const map: Record<string, string> = {
    rsi: "RSI",
    macd: "MACD",
    sma_trend: "SMA",
    ema_trend: "EMA",
  };
  return map[name] || name;
}

export function IndicatorConfidenceChart({ signals }: IndicatorConfidenceChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const textColor = isDark ? "#9ca3af" : "#6b7280";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  const data = signals.map((s) => ({
    name: formatIndicatorName(s.name),
    confidence: +(s.confidence * 100).toFixed(0),
    fill:
      s.action === "BUY"
        ? "#22c55e"
        : s.action === "SELL"
        ? "#ef4444"
        : isDark
        ? "#6b7280"
        : "#9ca3af",
  }));

  if (data.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">Signal Confidence by Indicator</p>
      <ResponsiveContainer width="100%" height={data.length * 48 + 20}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 48 }}
          barSize={20}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: textColor }} tickLine={false} axisLine={false} width={32} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: textColor }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Bar dataKey="confidence" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
