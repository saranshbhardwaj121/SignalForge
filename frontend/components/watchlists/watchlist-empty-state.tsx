import { ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WatchlistEmptyStateProps {
  onCreateClick: () => void;
}

export function WatchlistEmptyState({ onCreateClick }: WatchlistEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <ListChecks className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">No watchlists yet</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
          Create your first watchlist to start tracking stocks
        </p>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create watchlist
        </button>
      </CardContent>
    </Card>
  );
}

export function TickerEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <p className="text-sm text-muted-foreground mb-1">No tickers in this watchlist</p>
      <p className="text-xs text-muted-foreground">Add a ticker to start tracking</p>
    </div>
  );
}
