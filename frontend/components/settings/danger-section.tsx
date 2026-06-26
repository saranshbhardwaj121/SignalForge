"use client";

import * as React from "react";
import { LogOut, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
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
import { useDeleteAccountMutation } from "@/features/auth/hooks";

export function DangerSection() {
  const { logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState("");
  const deleteAccountMutation = useDeleteAccountMutation();

  const handleLogout = () => {
    setLogoutOpen(false);
    logout();
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate(
      { password: deletePassword },
      { onSettled: () => setDeletePassword("") },
    );
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Log out</p>
            <p className="text-xs text-muted-foreground">
              End your current session and return to the login page
            </p>
          </div>
          <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
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
                <Button variant="outline" onClick={() => setLogoutOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleLogout}>
                  Log out
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <hr className="border-destructive/10" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2 shrink-0">
                <Trash2 className="h-4 w-4" />
                Delete account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Confirm account deletion
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete your account, watchlists, portfolio, signals, and all
                  associated data. Enter your password to confirm.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <PasswordInput
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={deleteAccountMutation.isPending}
                />
                {deleteAccountMutation.isError && (
                  <p className="text-sm text-destructive mt-2">
                    {deleteAccountMutation.error instanceof Error
                      ? deleteAccountMutation.error.message
                      : "Failed to delete account. Please try again."}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeletePassword("");
                    deleteAccountMutation.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending || !deletePassword}
                >
                  {deleteAccountMutation.isPending ? "Deleting..." : "Delete account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
