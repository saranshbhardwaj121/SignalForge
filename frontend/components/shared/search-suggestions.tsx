"use client";

import * as React from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResultItem } from "@/features/search/types";

interface SearchSuggestionsProps {
  suggestions: SearchResultItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  highlightedIndex: number;
  query: string;
  onSelect: (item: SearchResultItem) => void;
  onRetry: () => void;
}

export function SearchSuggestions({
  suggestions,
  isLoading,
  isError,
  errorMessage,
  highlightedIndex,
  query,
  onSelect,
  onRetry,
}: SearchSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md z-50 p-2">
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-3 flex-1 bg-muted rounded" />
              <div className="h-4 w-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md z-50">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">
            {errorMessage || "Search unavailable"}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0 && query.trim().length >= 1) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md z-50">
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Search className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No tickers found for &ldquo;{query}&rdquo;
          </p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md z-50 max-h-72 overflow-y-auto">
      {suggestions.map((item, index) => (
        <button
          key={`${item.ticker}-${index}`}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          className={cn(
            "w-full text-left px-3 py-2 flex items-center gap-3 transition-colors",
            index === highlightedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
        >
          <span className="font-mono text-sm font-medium shrink-0">
            {item.ticker}
          </span>
          {item.name && (
            <span className="text-xs text-muted-foreground truncate min-w-0">
              {item.name}
            </span>
          )}
          {item.exchange && (
            <span className="ml-auto text-[10px] uppercase text-muted-foreground shrink-0 border rounded px-1">
              {item.exchange}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
