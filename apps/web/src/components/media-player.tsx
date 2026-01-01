"use client";

import React, { useEffect } from "react";
import { usePlayer } from "@/context/player-context";
import { Play, Pause, X, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export function MediaPlayer() {
  const {
    currentArticle,
    isPlaying,
    togglePlay,
    audioRef,
    progress,
    seek, // We will need to implement seek in context or handle it here if context exposes setters, but context exposed audioRef.
    // Actually, let's keep logic simple. The context provides the ref, this component renders the audio tag.
  } = usePlayer();

  // Local state for progress to avoid too many re-renders in context if we were storing it there,
  // but for a simple app sending progress to context is fine or keeping it local.
  // Let's rely on the ref for events.
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      // Handle end of playback if needed
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioRef, currentArticle]);

  // Auto-play when currentArticle changes
  useEffect(() => {
    if (currentArticle && audioRef.current) {
      audioRef.current.play().catch((e) => console.error("Playback failed", e));
    }
  }, [currentArticle]);

  // Sync play/pause state with audio element just in case
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch((e) => console.error(e));
      } else if (!isPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  if (!currentArticle) return null;

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-t p-4 z-50 transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-full">
      <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={currentArticle.audio_url}
          onError={(e) => {
            console.error("Audio tag error:", e.currentTarget.error);
            console.error("Source URL was:", currentArticle.audio_url);
          }}
          onLoadStart={() => console.log("Audio load started")}
          onCanPlay={() => console.log("Audio can play")}
        />

        {/* Article Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">
            {currentArticle.title}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {new URL(currentArticle.original_url).hostname.replace("www.", "")}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime -= 10;
              }}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime += 10;
              }}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Close / Extra Actions (Placeholder) */}
        <div className="flex-1 flex justify-end">
          {/* Can add volume or close here */}
        </div>
      </div>
    </div>
  );
}
