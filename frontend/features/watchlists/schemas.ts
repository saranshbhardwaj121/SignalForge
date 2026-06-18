import { z } from "zod";

export const createWatchlistSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
});

export const addTickerSchema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .max(20, "Ticker must be 20 characters or less")
    .toUpperCase(),
});

export type CreateWatchlistFormData = z.infer<typeof createWatchlistSchema>;
export type AddTickerFormData = z.infer<typeof addTickerSchema>;
