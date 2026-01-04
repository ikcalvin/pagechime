"use client";

import React from "react";
import { SidebarContent } from "@/components/sidebar-content";

export function Sidebar() {
  return (
    <div className="hidden lg:flex w-64 shrink-0 border-r bg-background h-[calc(100vh-4rem)] sticky top-16 py-6 pl-4 pr-6 flex-col gap-6">
      <SidebarContent />
    </div>
  );
}
