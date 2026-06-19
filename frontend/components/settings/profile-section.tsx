"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/context";

export function ProfileSection() {
  const { user, isLoading } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        ) : user ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-medium">
                {new Date(user.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Unable to load profile</p>
        )}
      </CardContent>
    </Card>
  );
}
