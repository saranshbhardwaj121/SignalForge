"use client";

import * as React from "react";
import { useTheme } from "next-themes";

interface ConfidenceGaugeProps {
  value: number;
  rating: string;
  size?: number;
}

export function ConfidenceGauge({ value, rating, size = 96 }: ConfidenceGaugeProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const percent = Math.min(value, 1);
  const percentDisplay = `${(percent * 100).toFixed(0)}%`;

  const isBuy = rating === "BUY";
  const isSell = rating === "SELL";

  const arcColor = isBuy
    ? "#22c55e"
    : isSell
    ? "#ef4444"
    : isDark
    ? "#6b7280"
    : "#9ca3af";

  const bgColor = isDark ? "#374151" : "#e5e7eb";
  const textColor = isDark ? "#e5e7eb" : "#111827";
  const labelColor = isDark ? "#9ca3af" : "#6b7280";

  const radius = 36;
  const circumference = Math.PI * radius;
  const filledLength = percent * circumference;

  const svgSize = size;
  const viewBox = "0 0 96 56";
  const centerX = 48;
  const centerY = 50;
  const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

  return (
    <div className="flex flex-col items-center">
      <svg width={svgSize} height={svgSize * (56 / 96)} viewBox={viewBox} className="overflow-visible">
        <path
          d={arcPath}
          fill="none"
          stroke={bgColor}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d={arcPath}
          fill="none"
          stroke={arcColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${circumference}`}
          className="transition-all duration-500 ease-out"
        />
        <text
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          fill={textColor}
          fontSize="18"
          fontWeight="bold"
        >
          {percentDisplay}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          fill={labelColor}
          fontSize="10"
        >
          Confidence
        </text>
      </svg>
    </div>
  );
}
