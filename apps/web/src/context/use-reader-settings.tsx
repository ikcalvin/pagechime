"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ReaderTheme = "light" | "sepia" | "dark" | "black";
export type ReaderFont = "sans" | "serif" | "mono";
export type ReaderWidth = "standard" | "wide";

export interface ReaderSettings {
    font: ReaderFont;
    fontSize: number;
    width: ReaderWidth;
    theme: ReaderTheme;
}

const DEFAULT_SETTINGS: ReaderSettings = {
    font: "sans",
    fontSize: 20,
    width: "standard",
    theme: "light",
};

interface ReaderSettingsContextType {
    settings: ReaderSettings;
    updateSettings: (newSettings: ReaderSettings) => void;
    mounted: boolean;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType | undefined>(
    undefined
);

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem("reader-settings");
        if (saved) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            } catch (e) {
                console.error("Failed to parse reader settings", e);
            }
        }
    }, []);

    const updateSettings = (newSettings: ReaderSettings) => {
        setSettings(newSettings);
        // Persist to local storage
        if (typeof window !== "undefined") {
            localStorage.setItem("reader-settings", JSON.stringify(newSettings));
        }
    };

    return (
        <ReaderSettingsContext.Provider value= {{ settings, updateSettings, mounted }
}>
    { children }
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings() {
    const context = useContext(ReaderSettingsContext);
    if (context === undefined) {
        throw new Error(
            "useReaderSettings must be used within a ReaderSettingsProvider"
        );
    }
    return context;
}
