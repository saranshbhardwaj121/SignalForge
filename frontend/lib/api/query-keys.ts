export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  watchlists: {
    all: ["watchlists"] as const,
    detail: (id: string) => ["watchlists", id] as const,
    quotes: (id: string) => ["watchlists", id, "quotes"] as const,
    signals: (id: string) => ["watchlists", id, "signals"] as const,
  },
  marketData: {
    quote: (ticker: string) => ["market-data", "quote", ticker] as const,
    history: (ticker: string) => ["market-data", "history", ticker] as const,
  },
  analytics: {
    sma: (ticker: string) => ["analytics", ticker, "sma"] as const,
    ema: (ticker: string) => ["analytics", ticker, "ema"] as const,
    rsi: (ticker: string) => ["analytics", ticker, "rsi"] as const,
    macd: (ticker: string) => ["analytics", ticker, "macd"] as const,
  },
  signals: {
    ticker: (ticker: string) => ["signals", ticker] as const,
  },
} as const;
