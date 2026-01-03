"use client";

import React from "react";
import { Type, Minus, Plus, AlignJustify, AlignCenter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";

export type ReaderFont = "sans" | "serif" | "mono";
export type ReaderTheme = "light" | "sepia" | "dark" | "black";
export type ReaderWidth = "standard" | "wide";

export interface ReaderSettings {
  font: ReaderFont;
  fontSize: number;
  theme: ReaderTheme;
  width: ReaderWidth;
}

interface ReaderSettingsMenuProps {
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
}

export function ReaderSettingsMenu({
  settings,
  onSettingsChange,
}: ReaderSettingsMenuProps) {
  const updateSetting = <K extends keyof ReaderSettings>(
    key: K,
    value: ReaderSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Text Settings">
          <Type className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Font Family */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Font
            </h4>
            <ToggleGroup
              type="single"
              value={settings.font}
              onValueChange={(val: string) =>
                val && updateSetting("font", val as ReaderFont)
              }
              className="justify-start border rounded-md p-1"
            >
              <ToggleGroupItem
                value="sans"
                className="flex-1 font-sans"
                aria-label="Sans-serif"
              >
                Sans
              </ToggleGroupItem>
              <ToggleGroupItem
                value="serif"
                className="flex-1 font-serif"
                aria-label="Serif"
              >
                Serif
              </ToggleGroupItem>
              <ToggleGroupItem
                value="mono"
                className="flex-1 font-mono"
                aria-label="Monospace"
              >
                Mono
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Size
            </h4>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  updateSetting("fontSize", Math.max(12, settings.fontSize - 2))
                }
                disabled={settings.fontSize <= 12}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1 text-center font-medium">
                {settings.fontSize}px
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  updateSetting("fontSize", Math.min(32, settings.fontSize + 2))
                }
                disabled={settings.fontSize >= 32}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Width */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Width
            </h4>
            <ToggleGroup
              type="single"
              value={settings.width}
              onValueChange={(val: string) =>
                val && updateSetting("width", val as ReaderWidth)
              }
              className="justify-start border rounded-md p-1"
            >
              <ToggleGroupItem
                value="standard"
                className="flex-1"
                aria-label="Standard Width"
              >
                <AlignJustify className="h-4 w-4 mr-2" /> Standard
              </ToggleGroupItem>
              <ToggleGroupItem
                value="wide"
                className="flex-1"
                aria-label="Wide Width"
              >
                <AlignCenter className="h-4 w-4 mr-2" /> Wide
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          {/* Theme */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Theme
            </h4>
            <div className="grid grid-cols-4 gap-2">
              <button
                className={`h-10 w-full rounded-full border bg-white ring-offset-background transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  settings.theme === "light"
                    ? "ring-2 ring-primary border-primary"
                    : "border-slate-200"
                }`}
                onClick={() => updateSetting("theme", "light")}
                title="Light"
              >
                <span className="sr-only">Light</span>
                <span className="block text-slate-900 font-serif text-lg">
                  A
                </span>
              </button>
              <button
                className={`h-10 w-full rounded-full border bg-[#f4ecd8] ring-offset-background transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  settings.theme === "sepia"
                    ? "ring-2 ring-primary border-primary"
                    : "border-[#e6dbbf]"
                }`}
                onClick={() => updateSetting("theme", "sepia")}
                title="Sepia"
              >
                <span className="sr-only">Sepia</span>
                <span className="block text-[#5b4636] font-serif text-lg">
                  A
                </span>
              </button>
              <button
                className={`h-10 w-full rounded-full border bg-slate-900 ring-offset-background transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  settings.theme === "dark"
                    ? "ring-2 ring-primary border-primary"
                    : "border-slate-800"
                }`}
                onClick={() => updateSetting("theme", "dark")}
                title="Dark"
              >
                <span className="sr-only">Dark</span>
                <span className="block text-slate-100 font-serif text-lg">
                  A
                </span>
              </button>
              <button
                className={`h-10 w-full rounded-full border bg-black ring-offset-background transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  settings.theme === "black"
                    ? "ring-2 ring-primary border-primary"
                    : "border-zinc-800"
                }`}
                onClick={() => updateSetting("theme", "black")}
                title="Black"
              >
                <span className="sr-only">Black</span>
                <span className="block text-zinc-300 font-serif text-lg">
                  A
                </span>
              </button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
