"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTheme } from "next-themes";
import type { WatchlistSignalItem } from "@/features/signals/types";

interface SignalDistributionChartProps {
  signals: WatchlistSignalItem[];
}

export function SignalDistributionChart({ signals }: SignalDistributionChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const labelColor = isDark ? "#9ca3af" : "#6b7280";

  const buyCount = signals.filter((s) => s.summary?.rating === "BUY").length;
  const sellCount = signals.filter((s) => s.summary?.rating === "SELL").length;
  const neutralCount = signals.filter((s) => s.summary?.rating === "NEUTRAL").length;
  const errorCount = signals.filter((s) => s.error && !s.summary).length;
  const total = signals.length;

  const data = [
    ...(buyCount > 0 ? [{ name: "Buy", value: buyCount, color: "#22c55e" }] : []),
    ...(sellCount > 0 ? [{ name: "Sell", value: sellCount, color: "#ef4444" }] : []),
    ...(neutralCount > 0 ? [{ name: "Neutral", value: neutralCount, color: isDark ? "#6b7280" : "#9ca3af" }] : []),
    ...(errorCount > 0 ? [{ name: "Error", value: errorCount, color: "#f59e0b" }] : []),
  ];

  if (data.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold tabular-nums">{total}</span>
          <span className="text-xs" style={{ color: labelColor }}>Total</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs text-muted-foreground">
              {d.name} ({d.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
