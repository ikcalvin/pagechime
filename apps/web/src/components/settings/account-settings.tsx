"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateEmail, updatePassword } from "@/app/(app)/settings/actions";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

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

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : text}
    </Button>
  );
}

export function AccountSettings({ userEmail }: { userEmail: string }) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  async function handleEmailSubmit(formData: FormData) {
    const result = await updateEmail({}, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      setEmailOpen(false);
    }
  }

  async function handlePasswordSubmit(formData: FormData) {
    const result = await updatePassword({}, formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success);
      setPasswordOpen(false);
    }
  }

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
            value={userEmail}
            action={
              <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary hover:text-primary/80"
                  >
                    Change
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Email</DialogTitle>
                    <DialogDescription>
                      Enter your new email address. We will send you a
                      confirmation link.
                    </DialogDescription>
                  </DialogHeader>
                  <form action={handleEmailSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="m@example.com"
                          required
                          defaultValue={userEmail}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <SubmitButton text="Save changes" />
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            }
          />
          <SettingsRow
            label="Password"
            value="••••••••"
            action={
              <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary hover:text-primary/80"
                  >
                    Change
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your new password.
                    </DialogDescription>
                  </DialogHeader>
                  <form action={handlePasswordSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="New password"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm new password"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <SubmitButton text="Update Password" />
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
    </div>
  );
}
