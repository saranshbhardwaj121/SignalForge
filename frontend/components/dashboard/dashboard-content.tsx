"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlistsQuery } from "@/features/watchlists/hooks";

export function DashboardContent() {
  const { data: watchlists, isLoading, isError } = useWatchlistsQuery();

  const totalWatchlists = watchlists?.length ?? 0;
  const totalTickers = watchlists?.reduce((sum, wl) => sum + wl.items.length, 0) ?? 0;
  const recentWatchlists = watchlists?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to SignalForge. Your market intelligence platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watchlists</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalWatchlists}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Tickers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalTickers}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Watchlists</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Failed to load watchlists</p>
        ) : recentWatchlists.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No watchlists yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {recentWatchlists.map((wl) => (
              <Card key={wl.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{wl.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wl.items.length} {wl.items.length === 1 ? "ticker" : "tickers"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(wl.updated_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
