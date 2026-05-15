"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Mail, Lock, CreditCard } from "lucide-react";

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
    <div className="p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">Account</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your login details and subscription.
        </p>
      </div>

      <div className="space-y-0 divide-y divide-border/50">
        {/* Email */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </div>
          <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">
                Change
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Email</DialogTitle>
                <DialogDescription>
                  Enter your new email address. We will send you a confirmation
                  link.
                </DialogDescription>
              </DialogHeader>
              <form action={handleEmailSubmit}>
                <div className="grid gap-4 py-4">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    defaultValue={userEmail}
                  />
                </div>
                <DialogFooter>
                  <SubmitButton text="Save changes" />
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Password */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">••••••••</p>
            </div>
          </div>
          <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 h-8 text-xs">
                Change
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>Enter your new password.</DialogDescription>
              </DialogHeader>
              <form action={handlePasswordSubmit}>
                <div className="grid gap-4 py-4">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="New password"
                    required
                    minLength={6}
                  />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
                <DialogFooter>
                  <SubmitButton text="Update Password" />
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subscription */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Subscription</p>
              <p className="text-sm text-muted-foreground">Free Plan</p>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            className="shrink-0 h-8 text-xs bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 text-white"
          >
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
}
