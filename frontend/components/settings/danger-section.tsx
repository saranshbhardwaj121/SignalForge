"use client";

import * as React from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/context";

export function DangerSection() {
  const { logout } = useAuth();
  const [open, setOpen] = React.useState(false);

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Log out</p>
            <p className="text-xs text-muted-foreground">
              End your current session and return to the login page
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2 shrink-0">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirm logout
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to log out? You will need to sign in again to access your data.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleLogout}>
                  Log out
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
