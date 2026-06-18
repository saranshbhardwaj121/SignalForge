"use client";

import * as React from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddTickerForm } from "@/components/watchlists/add-ticker-form";
import { TickerList } from "@/components/watchlists/ticker-list";
import { QuoteTable } from "@/components/watchlists/quote-table";
import { WatchlistDetailSkeleton } from "@/components/watchlists/watchlist-skeleton";
import { useWatchlistsQuery } from "@/features/watchlists/hooks";
import type { Watchlist } from "@/features/watchlists/types";

interface WatchlistDetailPanelProps {
  watchlistId: string;
  onBack: () => void;
  onDelete: (watchlist: Watchlist) => void;
}

export function WatchlistDetailPanel({
  watchlistId,
  onBack,
  onDelete,
}: WatchlistDetailPanelProps) {
  const { data: watchlists, isLoading } = useWatchlistsQuery();
  const watchlist = watchlists?.find((w) => w.id === watchlistId);

  if (isLoading) {
    return <WatchlistDetailSkeleton />;
  }

  if (!watchlist) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">Watchlist not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{watchlist.name}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(watchlist)}
          className="text-muted-foreground hover:text-destructive"
          title="Delete watchlist"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <AddTickerForm watchlistId={watchlistId} />

      <TickerList watchlistId={watchlistId} items={watchlist.items} />

      <Separator />

      {watchlist.items.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Quotes</h3>
          <QuoteTable watchlistId={watchlistId} />
        </div>
      )}
    </div>
  );
}
