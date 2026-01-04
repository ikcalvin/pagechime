"use client";

import { useEffect } from "react";
import { useReaderSettings } from "@/context/use-reader-settings";

export function ThemeSynchronizer() {
  const { settings, mounted } = useReaderSettings();

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const body = document.body;

    const themeVars = {
      light: {
        "--background": "oklch(1 0 0)", // white
        "--foreground": "oklch(0.129 0.042 264.695)", // slate-950
        "--border": "oklch(0.929 0.013 255.508)",
        "--muted": "oklch(0.968 0.007 247.896)",
        "--muted-foreground": "oklch(0.554 0.046 257.417)",
        // Keep popovers standard light
        "--popover": "oklch(1 0 0)",
        "--popover-foreground": "oklch(0.129 0.042 264.695)",
        class: "",
        colorScheme: "light",
      },
      sepia: {
        "--background": "#f4ecd8",
        "--foreground": "#5b4636",
        "--border": "#e6dbbf",
        "--muted": "#e6dbbf",
        "--muted-foreground": "#8b7355",
        // Keep popovers standard light (don't use sepia)
        "--popover": "oklch(1 0 0)",
        "--popover-foreground": "oklch(0.129 0.042 264.695)",
        class: "",
        colorScheme: "light",
      },
      dark: {
        "--background": "#0f172a", // slate-900
        "--foreground": "#f1f5f9", // slate-100
        "--border": "#1e293b", // slate-800
        "--muted": "#1e293b",
        "--muted-foreground": "#94a3b8",
        // Keep popovers standard dark
        "--popover": "oklch(0.208 0.042 265.755)",
        "--popover-foreground": "oklch(0.984 0.003 247.858)",
        class: "dark",
        colorScheme: "dark",
      },
      black: {
        "--background": "#000000",
        "--foreground": "#d4d4d8", // zinc-300
        "--border": "#27272a", // zinc-800
        "--muted": "#27272a",
        "--muted-foreground": "#a1a1aa",
        // Keep popovers standard dark (don't go pure black, stay slate)
        "--popover": "oklch(0.208 0.042 265.755)",
        "--popover-foreground": "oklch(0.984 0.003 247.858)",
        class: "dark",
        colorScheme: "dark",
      },
    }[settings.theme];

    if (themeVars) {
      // 1. Handle Class
      if (themeVars.class === "dark") root.classList.add("dark");
      else root.classList.remove("dark");

      // 2. Handle Color Scheme
      root.style.colorScheme = themeVars.colorScheme;

      // 3. Handle Generic Backgrounds for scrollbar/overscroll
      root.style.backgroundColor = themeVars["--background"];
      body.style.backgroundColor = themeVars["--background"];

      // 4. Set Variables
      Object.entries(themeVars).forEach(([key, val]) => {
        if (key !== "class" && key !== "colorScheme") {
          root.style.setProperty(key, val);
        }
      });
    }
  }, [settings.theme, mounted]);

  return null; // Logic only component
}
