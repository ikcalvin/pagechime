"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function DangerZone() {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-destructive">
          Danger Zone
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Irreversible actions. Proceed with caution.
        </p>
      </div>

      <div className="flex items-center justify-between py-3.5 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently remove your account and all data.
            </p>
          </div>
        </div>
        <Button variant="destructive" size="sm" className="shrink-0 h-8 text-xs">
          Delete Account
        </Button>
      </div>
    </div>
  );
}
