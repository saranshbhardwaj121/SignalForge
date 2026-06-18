"use client";

import * as React from "react";
import { WatchlistListSkeleton } from "@/components/watchlists/watchlist-skeleton";
import { WatchlistCard } from "@/components/watchlists/watchlist-card";
import { WatchlistEmptyState } from "@/components/watchlists/watchlist-empty-state";
import { WatchlistListErrorState } from "@/components/watchlists/watchlist-error-state";
import { useWatchlistsQuery } from "@/features/watchlists/hooks";
import type { Watchlist } from "@/features/watchlists/types";

interface WatchlistListProps {
  selectedId: string | null;
  onSelect: (watchlist: Watchlist) => void;
  onDelete: (watchlist: Watchlist) => void;
  onCreateClick: () => void;
}

export function WatchlistList({
  selectedId,
  onSelect,
  onDelete,
  onCreateClick,
}: WatchlistListProps) {
  const { data: watchlists, isLoading, isError, error, refetch } = useWatchlistsQuery();

  if (isLoading) {
    return <WatchlistListSkeleton />;
  }

  if (isError) {
    return (
      <WatchlistListErrorState
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  if (!watchlists || watchlists.length === 0) {
    return <WatchlistEmptyState onCreateClick={onCreateClick} />;
  }

  return (
    <div className="space-y-1">
      {watchlists.map((watchlist) => (
        <WatchlistCard
          key={watchlist.id}
          watchlist={watchlist}
          isSelected={selectedId === watchlist.id}
          onSelect={() => onSelect(watchlist)}
          onDelete={() => onDelete(watchlist)}
        />
      ))}
    </div>
  );
}
