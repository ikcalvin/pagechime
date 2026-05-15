"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

// Unified playable item — works for articles AND newsletters
export type PlayableItem = {
  id: string;
  title: string;
  source: string; // hostname or newsletter source name
  audioUrl: string;
  imageUrl?: string;
  type: "article" | "newsletter" | "briefing";
};

// Convert legacy Article to PlayableItem
export function articleToPlayable(article: {
  id: string;
  title: string;
  original_url: string;
  audio_url?: string;
  image_url?: string;
}): PlayableItem | null {
  if (!article.audio_url) return null;
  return {
    id: article.id,
    title: article.title,
    source: (() => {
      try {
        return new URL(article.original_url).hostname.replace("www.", "");
      } catch {
        return "Unknown";
      }
    })(),
    audioUrl: article.audio_url,
    imageUrl: article.image_url,
    type: "article",
  };
}

type AudioContextType = {
  // Current track
  currentItem: PlayableItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Controls
  play: (item: PlayableItem) => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (time: number) => void;
  skipForward: () => void;
  skipBack: () => void;

  // Speed
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;

  // Volume
  volume: number;
  setVolume: (vol: number) => void;
  isMuted: boolean;
  toggleMute: () => void;

  // Queue
  queue: PlayableItem[];
  addToQueue: (item: PlayableItem) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  playNext: () => void;
  hasNext: boolean;

  // Ref for direct audio element access if needed
  audioRef: React.RefObject<HTMLAudioElement | null>;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const SKIP_SECONDS = 15;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export { SPEED_OPTIONS };

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentItem, setCurrentItem] = useState<PlayableItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState(1);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState<PlayableItem[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync playback speed to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      // Auto-play next in queue
      if (queue.length > 0) {
        const next = queue[0];
        setQueue((q) => q.slice(1));
        setCurrentItem(next);
        setIsPlaying(true);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [queue]);

  // Auto-play when currentItem changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentItem) return;

    audio.src = currentItem.audioUrl;
    audio.playbackRate = playbackSpeed;
    audio.volume = isMuted ? 0 : volume;
    setCurrentTime(0);
    setDuration(0);

    if (isPlaying) {
      audio.play().catch((e) => console.error("Playback failed:", e));
    }
  }, [currentItem]);

  const play = useCallback(
    (item: PlayableItem) => {
      if (currentItem?.id === item.id) {
        // Same track — toggle
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
          } else {
            audioRef.current.play().catch(console.error);
          }
        }
        return;
      }
      setCurrentItem(item);
      setIsPlaying(true);
    },
    [currentItem, isPlaying]
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + SKIP_SECONDS,
        audioRef.current.duration || 0
      );
    }
  }, []);

  const skipBack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - SKIP_SECONDS,
        0
      );
    }
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (vol > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const addToQueue = useCallback((item: PlayableItem) => {
    setQueue((q) => {
      if (q.some((i) => i.id === item.id)) return q;
      return [...q, item];
    });
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((q) => q.filter((i) => i.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    const next = queue[0];
    setQueue((q) => q.slice(1));
    setCurrentItem(next);
    setIsPlaying(true);
  }, [queue]);

  return (
    <AudioContext.Provider
      value={{
        currentItem,
        isPlaying,
        currentTime,
        duration,
        play,
        togglePlay,
        pause,
        seek,
        skipForward,
        skipBack,
        playbackSpeed,
        setPlaybackSpeed,
        volume,
        setVolume,
        isMuted,
        toggleMute,
        queue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        playNext,
        hasNext: queue.length > 0,
        audioRef,
      }}
    >
      {children}
      {/* Hidden audio element — always mounted */}
      <audio ref={audioRef} preload="metadata" />
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
