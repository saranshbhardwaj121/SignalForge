"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useChartColors, ChartContainer } from "@/components/charts/chart-container";
import type { IndicatorPoint } from "@/features/analytics/types";

interface RsiChartProps {
  data: IndicatorPoint[];
  height?: number;
}

function RsiChartInner({ data }: { data: IndicatorPoint[] }) {
  const { colors } = useChartColors();

  const formatted = data.map((d) => ({
    ...d,
    dateStr: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis
          dataKey="dateStr"
          tick={{ fontSize: 10, fill: colors.text }}
          tickLine={false}
          axisLine={{ stroke: colors.grid }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: colors.text }}
          tickLine={false}
          axisLine={false}
          width={24}
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
            if (name === "value") return [Number(value).toFixed(1), "RSI"];
            return [Number(value).toFixed(2), "Close"];
          }}
        />
        <ReferenceLine y={70} stroke={colors.red} strokeDasharray="4 4" strokeWidth={1} />
        <ReferenceLine y={30} stroke={colors.green} strokeDasharray="4 4" strokeWidth={1} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={colors.green}
          fill={colors.green}
          fillOpacity={0.1}
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RsiChart({ data, height = 180 }: RsiChartProps) {
  if (!data || data.length === 0) return null;
  return (
    <ChartContainer height={height}>
      <RsiChartInner data={data} />
    </ChartContainer>
  );
}
