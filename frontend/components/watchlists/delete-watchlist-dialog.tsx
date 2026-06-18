"use client";

import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteWatchlistMutation } from "@/features/watchlists/hooks";

interface DeleteWatchlistDialogProps {
  watchlistName: string;
  watchlistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteWatchlistDialog({
  watchlistName,
  watchlistId,
  open,
  onOpenChange,
}: DeleteWatchlistDialogProps) {
  const deleteMutation = useDeleteWatchlistMutation();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(watchlistId);
      onOpenChange(false);
    } catch {
      // Error toast handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete watchlist</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete <strong>{watchlistName}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
