"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useReaderSettings, ReaderTheme } from "@/context/use-reader-settings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { settings, updateSettings, mounted } = useReaderSettings();

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        className="text-muted-foreground"
      >
        <Sun className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  const setTheme = (theme: ReaderTheme) => {
    updateSettings({ ...settings, theme });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("sepia")}>
          <div className="mr-2 h-4 w-4 rounded-full bg-[#f4ecd8] border border-stone-300" />
          <span>Sepia</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("black")}>
          <div className="mr-2 h-4 w-4 rounded-full bg-black border border-stone-700" />
          <span>Black</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
