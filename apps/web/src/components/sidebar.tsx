"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Heart,
  Archive,
  Video,
  FileText,
  Tag,
  FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const sidebarItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Heart, label: "Liked", href: "/liked" },
  { icon: Archive, label: "Archive", href: "/archive" },
  { icon: Video, label: "Videos", href: "/videos" },
  { icon: FileText, label: "Notes", href: "/notes" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 shrink-0 border-r bg-background min-h-screen py-6 pl-4 pr-6 flex flex-col gap-6">
      {/* <div className="px-2">
        <h1 className="text-2xl font-serif font-bold tracking-tight mb-6">
          Instapaper
        </h1>
      </div> */}

      <nav className="flex flex-col gap-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-2 text-base font-medium",
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}

        <div className="mt-2 text-muted-foreground">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-2 text-base font-medium text-muted-foreground hover:text-foreground"
          >
            <Tag className="h-5 w-5" />
            Tags
            <span className="ml-auto bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              New
            </span>
          </Button>
        </div>
      </nav>

      <div className="mt-4 px-2">
        <Button
          variant="ghost"
          className="w-full justify-start pl-0 text-muted-foreground hover:text-foreground text-sm font-normal"
        >
          Add Folder
        </Button>
      </div>
    </div>
  );
}
