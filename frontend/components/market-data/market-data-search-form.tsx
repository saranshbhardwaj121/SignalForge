"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MarketDataSearchFormProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

export function MarketDataSearchForm({ onSearch, isLoading }: MarketDataSearchFormProps) {
  const [input, setInput] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = input.trim().toUpperCase();
    if (ticker) onSearch(ticker);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Enter ticker symbol..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="max-w-xs"
      />
      <Button type="submit" disabled={isLoading || !input.trim()}>
        <Search className="mr-1.5 h-3.5 w-3.5" />
        Lookup
      </Button>
    </form>
  );
}
