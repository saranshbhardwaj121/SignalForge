"use client";

import * as React from "react";
import { useAlertTriggersQuery } from "@/features/alerts/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AlertTriggerHistoryProps {
  alertId: string;
}

export function AlertTriggerHistory({ alertId }: AlertTriggerHistoryProps) {
  const { data: triggers, isLoading, isError } = useAlertTriggersQuery(alertId);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-2">Loading triggers...</p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive py-2">Failed to load triggers</p>
    );
  }

  if (!triggers || triggers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">No triggers recorded yet</p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Threshold</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {triggers.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="text-xs">
                {new Date(t.triggered_at).toLocaleString()}
              </TableCell>
              <TableCell>{t.triggered_value}</TableCell>
              <TableCell>{t.threshold}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  Triggered
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
