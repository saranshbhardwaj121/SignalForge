"use client";

import * as React from "react";
import { useRecentTickers } from "./use-recent-tickers";
import type { TickerContextValue } from "./types";

const TickerContext = React.createContext<TickerContextValue | undefined>(undefined);

export function TickerProvider({ children }: { children: React.ReactNode }) {
  const [activeTicker, setActiveTickerState] = React.useState<string | null>(null);
  const { recentTickers, pushRecentTicker, clearRecentTickers } = useRecentTickers();

  const setActiveTicker = React.useCallback(
    (ticker: string | null) => {
      setActiveTickerState(ticker);
      if (ticker) {
        pushRecentTicker(ticker);
      }
    },
    [pushRecentTicker]
  );

  const value = React.useMemo<TickerContextValue>(
    () => ({
      activeTicker,
      setActiveTicker,
      recentTickers,
      clearRecentTickers,
    }),
    [activeTicker, setActiveTicker, recentTickers, clearRecentTickers]
  );

  return React.createElement(TickerContext.Provider, { value }, children);
}

export function useTickerContext(): TickerContextValue {
  const context = React.useContext(TickerContext);
  if (!context) {
    throw new Error("useTickerContext must be used within a TickerProvider");
  }
  return context;
}
