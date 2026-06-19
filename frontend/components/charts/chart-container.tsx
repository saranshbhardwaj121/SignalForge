"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { ResponsiveContainer } from "recharts";

interface ChartContextValue {
  colors: {
    text: string;
    grid: string;
    primary: string;
    green: string;
    red: string;
    orange: string;
    purple: string;
    blue: string;
    histogramBar: string;
  };
  isDark: boolean;
}

const ChartContext = React.createContext<ChartContextValue | null>(null);

export function useChartColors(): ChartContextValue {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChartColors must be used within ChartContainer");
  return ctx;
}

interface ChartContainerProps {
  height?: number;
  children: React.ReactNode;
}

export function ChartContainer({ height = 180, children }: ChartContainerProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const colors: ChartContextValue["colors"] = {
    text: isDark ? "#9ca3af" : "#6b7280",
    grid: isDark ? "#374151" : "#e5e7eb",
    primary: isDark ? "#e5e7eb" : "#111827",
    green: "#22c55e",
    red: "#ef4444",
    orange: "#f59e0b",
    purple: "#a855f7",
    blue: "#3b82f6",
    histogramBar: isDark ? "#6b7280" : "#9ca3af",
  };

  if (!mounted) {
    return <div style={{ height }} />;
  }

  return (
    <ChartContext.Provider value={{ colors, isDark }}>
      <ResponsiveContainer width="100%" height={height}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </ChartContext.Provider>
  );
}
