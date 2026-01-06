"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  label: string;
  value?: string | React.ReactNode;
  action?: React.ReactNode;
  border?: boolean;
}

function SettingsRow({
  label,
  value,
  action,
  border = true,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4",
        border && "border-b border-border/50"
      )}
    >
      <div className="w-1/3 min-w-[120px]">
        <span className="text-sm font-medium text-foreground/90">{label}</span>
      </div>
      <div className="flex-1 flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground flex-1 truncate">
          {value}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}

export function ProfileSettings() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock state
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <div className="divide-y divide-border">
      {/* Account Section */}
      <div className="grid md:grid-cols-[240px_1fr] gap-4 md:gap-8 py-8">
        <div>
          <h3 className="font-semibold text-lg">Account</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your login details and subscription.
          </p>
        </div>

        <div className="space-y-1">
          <SettingsRow
            label="Email"
            value="kcalvin@outlook.com"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-primary hover:text-primary/80"
              >
                Change
              </Button>
            }
          />
          <SettingsRow
            label="Password"
            value="••••••••"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-primary hover:text-primary/80"
              >
                Change
              </Button>
            }
          />
          <SettingsRow
            label="Subscription"
            value="Free Plan"
            border={false}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-primary hover:text-primary/80"
              >
                Upgrade
              </Button>
            }
          />
        </div>
      </div>

      {/* Profile Section */}
      <div className="grid md:grid-cols-[240px_1fr] gap-4 md:gap-8 py-8">
        <div>
          <h3 className="font-semibold text-lg">Profile</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your public profile information.
          </p>
        </div>

        <div className="space-y-1">
          <SettingsRow
            label="Avatar"
            value={
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border overflow-hidden">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            }
            action={
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-primary hover:text-primary/80"
                >
                  Change
                </Button>
              </div>
            }
          />

          <SettingsRow
            label="Display Name"
            value="kcalvin"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-primary hover:text-primary/80"
              >
                Change
              </Button>
            }
          />

          <SettingsRow
            label="Username"
            value="Not set"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-primary hover:text-primary/80"
              >
                Set Username
              </Button>
            }
          />

          <SettingsRow
            label="Bio"
            value="No bio yet"
            border={false}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-primary hover:text-primary/80"
              >
                Add Bio
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}
