"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
} from "react";

export type Article = {
  id: string;
  title: string;
  original_url: string;
  status: "queued" | "processing" | "completed" | "failed";
  created_at: string;
  audio_url?: string;
  clean_text?: string;
  image_url?: string;
};

type PlayerContextType = {
  currentArticle: Article | null;
  isPlaying: boolean;
  togglePlay: () => void;
  playArticle: (article: Article) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  progress: number;
  duration: number;
  seek: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playArticle = (article: Article) => {
    if (currentArticle?.id === article.id) {
      togglePlay();
      return;
    }

    setCurrentArticle(article);
    setIsPlaying(true);
    // Audio source update happens via the audio element's src prop in MediaPlayer or Effect
    // But since we are passing ref, we rely on the component using the ref to handle src updates or just use effect here
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentArticle,
        isPlaying,
        togglePlay,
        playArticle,
        audioRef,
        progress,
        duration,
        seek,
        setIsPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
