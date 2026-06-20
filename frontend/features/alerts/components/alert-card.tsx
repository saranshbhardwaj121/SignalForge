"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUpdateAlert, useDeleteAlert } from "@/features/alerts/hooks";
import { AlertTriggerHistory } from "./alert-trigger-history";
import type { Alert, AlertType, AlertOperator } from "@/features/alerts/types";

const TYPE_LABELS: Record<AlertType, string> = {
  price: "Price",
  signal: "Signal",
  confidence: "Confidence",
  rsi: "RSI",
};

const OPERATOR_LABELS: Record<AlertOperator, string> = {
  gt: ">",
  lt: "<",
  gte: "\u2265",
  lte: "\u2264",
  eq: "=",
};

interface AlertCardProps {
  alert: Alert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const [showTriggers, setShowTriggers] = React.useState(false);
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();

  const handleToggle = () => {
    updateAlert.mutate({
      id: alert.id,
      data: { status: alert.status === "active" ? "inactive" : "active" },
    });
  };

  const handleDelete = () => {
    deleteAlert.mutate(alert.id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {alert.ticker}
            </CardTitle>
            <CardDescription>
              {TYPE_LABELS[alert.alert_type]} {OPERATOR_LABELS[alert.operator]}{" "}
              {alert.threshold}
              {alert.alert_type === "confidence" && " (" + (alert.threshold * 100).toFixed(0) + "%)"}
              {alert.parameters?.rsi_window != null && ` (${String(alert.parameters.rsi_window)})`}
            </CardDescription>
          </div>
          <Badge variant={alert.status === "active" ? "default" : "secondary"}>
            {alert.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={updateAlert.isPending}
          >
            {alert.status === "active" ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTriggers(!showTriggers)}
          >
            {showTriggers ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">
              {alert.trigger_count} trigger{alert.trigger_count !== 1 ? "s" : ""}
            </span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete alert?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the alert for {alert.ticker} and its trigger history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {alert.trigger_count > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            Last triggered alert available below
          </p>
        )}

        {showTriggers && (
          <div className="mt-4">
            <AlertTriggerHistory alertId={alert.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
