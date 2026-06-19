"use client";

import * as React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartColors, ChartContainer } from "@/components/charts/chart-container";
import type { MacdPoint } from "@/features/analytics/types";

interface MacdChartProps {
  data: MacdPoint[];
  height?: number;
}

function MacdChartInner({ data }: { data: MacdPoint[] }) {
  const { colors } = useChartColors();

  const formatted = data.map((d) => ({
    ...d,
    dateStr: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis
          dataKey="dateStr"
          tick={{ fontSize: 10, fill: colors.text }}
          tickLine={false}
          axisLine={{ stroke: colors.grid }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fontSize: 10, fill: colors.text }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => v.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            fontSize: "12px",
            borderRadius: "6px",
            border: "1px solid var(--border)",
            background: "var(--background)",
          }}
          labelFormatter={(label) => `Date: ${label}`}
          formatter={(value, name) => {
            const num = Number(value);
            switch (name) {
              case "macd": return [num.toFixed(2), "MACD Line"];
              case "signal": return [num.toFixed(2), "Signal Line"];
              case "histogram": return [num.toFixed(2), "Histogram"];
              default: return [num.toFixed(2), name];
            }
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: colors.text }}
          iconType="line"
          iconSize={10}
        />
        <Bar
          dataKey="histogram"
          fill={colors.histogramBar}
          opacity={0.5}
          name="Histogram"
          barSize={4}
        />
        <Line
          type="monotone"
          dataKey="macd"
          stroke={colors.blue}
          strokeWidth={1.5}
          dot={false}
          name="macd"
        />
        <Line
          type="monotone"
          dataKey="signal"
          stroke={colors.orange}
          strokeWidth={1.5}
          dot={false}
          name="signal"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function MacdChart({ data, height = 180 }: MacdChartProps) {
  if (!data || data.length === 0) return null;
  return (
    <ChartContainer height={height}>
      <MacdChartInner data={data} />
    </ChartContainer>
  );
}
