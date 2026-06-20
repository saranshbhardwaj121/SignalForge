"use client";

import * as React from "react";
import { AlertCreateForm } from "@/features/alerts/components/alert-create-form";
import { AlertList } from "@/features/alerts/components/alert-list";

export default function AlertsPage() {
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Create alert rules and monitor triggered conditions
          </p>
        </div>
      </div>

      {showCreateForm ? (
        <div className="max-w-lg">
          <AlertCreateForm onSuccess={() => setShowCreateForm(false)} />
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-solid transition-colors"
        >
          + Create Alert
        </button>
      )}

      <AlertList />
    </div>
  );
}
