"use client";

import * as React from "react";
import { useAlertsQuery } from "@/features/alerts/hooks";
import { AlertCard } from "./alert-card";
import { AlertEmptyState } from "./alert-empty-state";
import { AlertLoadingSkeleton } from "./alert-loading-skeleton";
import { AlertErrorState } from "./alert-error-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AlertList() {
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>();
  const { data: alerts, isLoading, isError, error, refetch } = useAlertsQuery(statusFilter);

  return (
    <div className="space-y-4">
      <Tabs
        value={statusFilter ?? "all"}
        onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <AlertLoadingSkeleton />}
      {isError && <AlertErrorState message={error?.message} onRetry={() => refetch()} />}
      {!isLoading && !isError && alerts && alerts.length === 0 && (
        <AlertEmptyState />
      )}
      {!isLoading && !isError && alerts && alerts.length > 0 && (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
