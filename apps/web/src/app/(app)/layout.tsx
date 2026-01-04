import Header from "@/components/header";
import { PlayerProvider } from "@/context/player-context";
import { MediaPlayer } from "@/components/media-player";
import { CollectionProvider } from "@/context/collection-context";
import { ThemeSynchronizer } from "@/components/theme-synchronizer";
import { ReaderSettingsProvider } from "@/context/use-reader-settings";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReaderSettingsProvider>
      <PlayerProvider>
        <CollectionProvider>
          <ThemeSynchronizer />
          <Header />
          <main className="container mx-auto pb-24">{children}</main>
          <MediaPlayer />
        </CollectionProvider>
      </PlayerProvider>
    </ReaderSettingsProvider>
  );
}
