import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PageChime",
  description: "Read, listen, and organize your favorite articles.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import { Toaster } from "@/components/ui/sonner";
import { PlayerProvider } from "@/context/player-context";
import { MediaPlayer } from "@/components/media-player";
import { AudioProvider } from "@/contexts/audio-context";
import { AudioPlayer } from "@/components/audio-player";
import { ReaderSettingsProvider } from "@/context/use-reader-settings";
import { ThemeSynchronizer } from "@/components/theme-synchronizer";

// Blocking script to apply theme class before first paint, preventing FOUC.
// Reads reader-settings from localStorage and applies .dark class + color-scheme
// synchronously so the browser never renders the wrong theme.
const themeScript = `
(function() {
  try {
    var s = JSON.parse(localStorage.getItem('reader-settings') || '{}');
    var t = s.theme || 'light';
    var d = document.documentElement;
    if (t === 'dark' || t === 'black') {
      d.classList.add('dark');
      d.style.colorScheme = 'dark';
    } else {
      d.classList.remove('dark');
      d.style.colorScheme = 'light';
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-foreground`}
      >
        <ReaderSettingsProvider>
          <PlayerProvider>
            <AudioProvider>
              <ThemeSynchronizer />
              {children}
              {/* Legacy player — handles existing article playback via usePlayer()/playArticle() */}
              <MediaPlayer />
              {/* New player — handles newsletter/briefing playback via useAudio()/play() */}
              <AudioPlayer />
              <Toaster position="top-center" />
            </AudioProvider>
          </PlayerProvider>
        </ReaderSettingsProvider>
      </body>
    </html>
  );
}
