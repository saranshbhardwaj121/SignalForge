"use client";

import { Bell } from "lucide-react";

export function AlertEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <Bell className="h-8 w-8 text-muted-foreground mb-2" />
      <h3 className="font-semibold">No alerts</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Create your first alert to get notified when conditions are met.
      </p>
    </div>
  );
}
