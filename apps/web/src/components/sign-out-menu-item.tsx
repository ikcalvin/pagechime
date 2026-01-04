"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/(auth)/actions";
import { LogOut } from "lucide-react";

export function SignOutMenuItem() {
  return (
    <DropdownMenuItem
      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
      onSelect={async () => {
        await signOut();
      }}
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Sign Out</span>
    </DropdownMenuItem>
  );
}
