"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartColors, ChartContainer } from "@/components/charts/chart-container";
import type { IndicatorPoint } from "@/features/analytics/types";

interface SmaChartProps {
  data: IndicatorPoint[];
  height?: number;
}

function SmaChartInner({ data }: { data: IndicatorPoint[] }) {
  const { colors } = useChartColors();

  const formatted = data.map((d) => ({
    ...d,
    dateStr: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
          tickFormatter={(v: number) => v.toLocaleString()}
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
            if (name === "close") return [Number(value).toFixed(2), "Close"];
            if (name === "value") return [Number(value).toFixed(2), "SMA"];
            return [Number(value).toFixed(2), name];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: "11px", color: colors.text }}
          iconType="line"
          iconSize={10}
        />
        <Line
          type="monotone"
          dataKey="close"
          stroke={colors.primary}
          strokeWidth={1.5}
          dot={false}
          name="Close"
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={colors.orange}
          strokeWidth={1.5}
          dot={false}
          name="SMA"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SmaChart({ data, height = 180 }: SmaChartProps) {
  if (!data || data.length === 0) return null;
  return (
    <ChartContainer height={height}>
      <SmaChartInner data={data} />
    </ChartContainer>
  );
}
