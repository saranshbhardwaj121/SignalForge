"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WatchlistList } from "@/components/watchlists/watchlist-list";
import { WatchlistDetailPanel } from "@/components/watchlists/watchlist-detail-panel";
import { CreateWatchlistDialog } from "@/components/watchlists/create-watchlist-dialog";
import { DeleteWatchlistDialog } from "@/components/watchlists/delete-watchlist-dialog";
import type { Watchlist } from "@/features/watchlists/types";

export function WatchlistsPageContent() {
  const [selectedWatchlist, setSelectedWatchlist] = React.useState<Watchlist | null>(null);
  const [showMobileDetail, setShowMobileDetail] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Watchlist | null>(null);

  const handleSelect = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setShowMobileDetail(true);
  };

  const handleDeleteRequest = (watchlist: Watchlist) => {
    setDeleteTarget(watchlist);
  };

  const handleDeleteConfirmClose = (open: boolean) => {
    if (!open) {
      if (deleteTarget && selectedWatchlist?.id === deleteTarget.id) {
        setSelectedWatchlist(null);
        setShowMobileDetail(false);
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex h-full gap-4">
      <div
        className={`w-full sm:w-80 shrink-0 ${
          showMobileDetail ? "hidden sm:block" : "block"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Watchlists</h2>
          <CreateWatchlistDialog open={createOpen} onOpenChange={setCreateOpen}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </CreateWatchlistDialog>
        </div>

        <WatchlistList
          selectedId={selectedWatchlist?.id ?? null}
          onSelect={handleSelect}
          onDelete={handleDeleteRequest}
          onCreateClick={() => setCreateOpen(true)}
        />
      </div>

      <div
        className={`flex-1 min-w-0 ${
          !showMobileDetail ? "hidden sm:block" : "block"
        }`}
      >
        {selectedWatchlist ? (
          <WatchlistDetailPanel
            watchlistId={selectedWatchlist.id}
            onBack={() => {
              setSelectedWatchlist(null);
              setShowMobileDetail(false);
            }}
            onDelete={handleDeleteRequest}
          />
        ) : (
          <div className="flex items-center justify-center h-full py-12 text-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Select a watchlist to view details
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or create a new one to get started
              </p>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <DeleteWatchlistDialog
          watchlistName={deleteTarget.name}
          watchlistId={deleteTarget.id}
          open={!!deleteTarget}
          onOpenChange={handleDeleteConfirmClose}
        />
      )}
    </div>
  );
}
