"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  X,
  ChevronUp,
} from "lucide-react";
import { useAudio, SPEED_OPTIONS } from "@/contexts/audio-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function formatTime(time: number): string {
  if (isNaN(time) || time === 0) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AudioPlayer() {
  const {
    currentItem,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
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
    removeFromQueue,
    playNext,
    hasNext,
  } = useAudio();

  const [showQueue, setShowQueue] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  if (!currentItem) return null;

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    setPlaybackSpeed(SPEED_OPTIONS[nextIndex]);
  };

  return (
    <>
      {/* Queue overlay */}
      {showQueue && (
        <div className="fixed bottom-16 right-4 z-50 w-80 bg-card border rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Up Next</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowQueue(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {queue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Queue is empty
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {queue.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
                >
                  {/* Thumbnail */}
                  <div className="h-8 w-8 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {item.title.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.source}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => removeFromQueue(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300 lg:left-[260px]">
        {/* Desktop Player */}
        <div className="hidden md:block bg-background/95 backdrop-blur-xl border-t">
          <div className="h-16 px-4 flex items-center gap-4">
            {/* Left: Track info */}
            <div className="flex items-center gap-3 w-[240px] min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-muted overflow-hidden">
                {currentItem.imageUrl ? (
                  <img
                    src={currentItem.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[#FF6B4A]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#FF6B4A]">
                      {currentItem.title.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentItem.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentItem.source}
                </p>
              </div>
            </div>

            {/* Center: Controls + Scrubber */}
            <div className="flex-1 flex flex-col items-center gap-1 max-w-[600px] mx-auto">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={skipBack}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={skipForward}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="w-full flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="w-10 text-right tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.5}
                  onValueChange={handleSeek}
                  className="flex-1"
                />
                <span className="w-10 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right: Speed, Volume, Queue */}
            <div className="flex items-center gap-1 w-[240px] justify-end">
              {/* Speed pill */}
              <button
                onClick={cycleSpeed}
                className="h-7 px-2.5 rounded-full text-[11px] font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors tabular-nums"
              >
                {playbackSpeed}x
              </button>

              {/* Volume */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
              />

              {/* Queue */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  showQueue
                    ? "text-[#FF6B4A]"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setShowQueue(!showQueue)}
              >
                <ListMusic className="h-4 w-4" />
                {queue.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#FF6B4A] text-white text-[9px] font-bold flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Player */}
        <div className="md:hidden bg-zinc-900 text-white p-2 mx-2 mb-2 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 pb-1">
            {/* Image */}
            <div className="h-10 w-10 shrink-0 rounded-lg bg-white/10 overflow-hidden">
              {currentItem.imageUrl ? (
                <img
                  src={currentItem.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-[#FF6B4A]">
                  {currentItem.title.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentItem.title}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {currentItem.source}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={cycleSpeed}
                className="h-7 px-2 rounded-full text-[11px] font-medium bg-white/10 text-zinc-300 tabular-nums"
              >
                {playbackSpeed}x
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:text-white/80 hover:bg-white/10"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile scrubber */}
          <div className="px-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="w-full [&>.relative]:h-0.5 [&_.absolute]:bg-white [&_span[role=slider]]:h-0 [&_span[role=slider]]:w-0 [&_span]:bg-white/30"
            />
          </div>
        </div>
      </div>
    </>
  );
}
