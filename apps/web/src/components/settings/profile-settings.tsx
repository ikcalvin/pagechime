"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { updateProfile } from "@/app/(app)/settings/actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export function ProfileSettings({ user }: { user?: any }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  );
  const [isPending, startTransition] = useTransition();

  const handleUpdateName = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateProfile({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated successfully");
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <div className="divide-y divide-border">
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
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border overflow-hidden relative">
                {user?.user_metadata?.avatar_url ||
                user?.user_metadata?.picture ? (
                  <Image
                    src={
                      user.user_metadata.avatar_url ||
                      user.user_metadata.picture
                    }
                    alt={displayName || "User Avatar"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            }
            action={
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-primary hover:text-primary/80"
                  disabled
                >
                  Change
                </Button>
              </div>
            }
          />

          <SettingsRow
            label="Display Name"
            value={
              user?.user_metadata?.full_name ||
              user?.user_metadata?.name ||
              "Not set"
            }
            action={
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary hover:text-primary/80"
                    onClick={() => {
                      setDisplayName(
                        user?.user_metadata?.full_name ||
                          user?.user_metadata?.name ||
                          ""
                      );
                      setIsDialogOpen(true);
                    }}
                  >
                    Change
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Display Name</DialogTitle>
                    <DialogDescription>
                      This is the name that will be displayed on your profile
                      and interactions.
                    </DialogDescription>
                  </DialogHeader>
                  <form action={handleUpdateName} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        name="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Display Name"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            }
          />

          <SettingsRow
            label="Username"
            value={user?.user_metadata?.username || "Not set"}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-primary hover:text-primary/80"
                disabled
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
                disabled
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
