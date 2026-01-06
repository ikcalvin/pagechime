"use client";

import { Button } from "@/components/ui/button";

export function DangerZone() {
  return (
    <div className="divide-y divide-border">
      <div className="grid md:grid-cols-[240px_1fr] gap-4 md:gap-8 py-8">
        <div>
          <h3 className="font-semibold text-lg text-destructive">
            Danger Zone
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Irreversible actions.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="space-y-1">
              <span className="text-sm font-medium text-foreground">
                Delete Account
              </span>
              <p className="text-sm text-muted-foreground">
                Permanently remove your account and all of its content.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
