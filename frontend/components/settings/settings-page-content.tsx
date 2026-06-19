"use client";

import * as React from "react";
import { ProfileSection } from "@/components/settings/profile-section";
import { ThemeSection } from "@/components/settings/theme-section";
import { DangerSection } from "@/components/settings/danger-section";

export function SettingsPageContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <div className="grid gap-6">
        <ProfileSection />
        <ThemeSection />
        <DangerSection />
      </div>
    </div>
  );
}
