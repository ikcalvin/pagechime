"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Pen } from "lucide-react";

export function ProfileSettings() {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">Profile</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your public profile information.
        </p>
      </div>

      <div className="space-y-0 divide-y divide-border/50">
        {/* Avatar */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Avatar</p>
              <p className="text-sm text-muted-foreground">Upload a photo</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">
            Change
          </Button>
        </div>

        {/* Display Name */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Pen className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Display Name</p>
              <p className="text-sm text-muted-foreground">kcalvin</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">
            Edit
          </Button>
        </div>

        {/* Username */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <span className="text-xs font-mono text-muted-foreground">@</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Username</p>
              <p className="text-sm text-muted-foreground italic">Not set</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">
            Set
          </Button>
        </div>

        {/* Bio */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <span className="text-xs text-muted-foreground">Bio</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Bio</p>
              <p className="text-sm text-muted-foreground italic">No bio yet</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
