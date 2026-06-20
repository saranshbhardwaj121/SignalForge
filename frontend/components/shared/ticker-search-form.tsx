"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SearchSuggestions } from "@/components/shared/search-suggestions";
import { useTickerSearchQuery } from "@/features/search/hooks";
import { useTickerContext } from "@/features/ticker/ticker-context";
import type { SearchResultItem } from "@/features/search/types";

interface TickerSearchFormProps {
  isLoading?: boolean;
  placeholder?: string;
  buttonLabel?: string;
  onSubmit?: (ticker: string) => void;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  className?: string;
  compact?: boolean;
}

export function TickerSearchForm({
  isLoading,
  placeholder = "Search tickers...",
  buttonLabel = "Search",
  onSubmit: onSubmitProp,
  autoFocus,
  inputRef: externalInputRef,
  className,
  compact,
}: TickerSearchFormProps) {
  const { setActiveTicker } = useTickerContext();
  const [inputValue, setInputValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const internalRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalRef;

  const {
    suggestions,
    isLoading: isSearching,
    isError,
    error,
    refetch,
  } = useTickerSearchQuery(inputValue);

  const showDropdown = isFocused && inputValue.trim().length >= 1;

  const commitTicker = React.useCallback(
    (ticker: string) => {
      const normalized = ticker.toUpperCase().trim();
      if (!normalized) return;
      if (onSubmitProp) {
        onSubmitProp(normalized);
      } else {
        setActiveTicker(normalized);
      }
      setInputValue("");
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    },
    [onSubmitProp, setActiveTicker, inputRef]
  );

  const handleSelect = React.useCallback(
    (item: SearchResultItem) => {
      commitTicker(item.ticker);
    },
    [commitTicker]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      commitTicker(suggestions[highlightedIndex].ticker);
    } else if (inputValue.trim()) {
      commitTicker(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Escape":
        setIsFocused(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  const handleClear = () => {
    setInputValue("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, inputRef]);

  React.useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative flex items-end gap-2", compact ? "max-w-xs" : "max-w-md", className)}
    >
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn("pl-8 pr-8", compact && "h-8 text-sm")}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {!compact && (
        <Button type="submit" disabled={isLoading || !inputValue.trim()}>
          {buttonLabel}
        </Button>
      )}

      {showDropdown && (
        <SearchSuggestions
          suggestions={suggestions}
          isLoading={isSearching}
          isError={isError}
          errorMessage={error?.message}
          highlightedIndex={highlightedIndex}
          query={inputValue}
          onSelect={handleSelect}
          onRetry={() => refetch()}
        />
      )}
    </form>
  );
}
