"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function AlertErrorState({ message, onRetry }: AlertErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
      <h3 className="font-semibold">Failed to load alerts</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {message || "Something went wrong"}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
