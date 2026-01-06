"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export function VoiceSettings() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const defaultVoice =
          availableVoices.find((v) => v.default) || availableVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  const handlePreview = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(
      "Hello, this is a preview of my voice."
    );
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="divide-y divide-border">
      <div className="grid md:grid-cols-[240px_1fr] gap-4 md:gap-8 py-8">
        <div>
          <h3 className="font-semibold text-lg">Voice</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Preferences for the article reader.
          </p>
        </div>

        <div className="space-y-4">
          {/* Voice Selection Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="space-y-1 w-full sm:w-1/3">
              <span className="text-sm font-medium text-foreground">
                Reader Voice
              </span>
            </div>
            <div className="flex-1 flex items-center gap-4 w-full">
              <select
                aria-label="Select Voice"
                className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePreview}
                title="Preview Voice"
              >
                <PlayCircle
                  className={
                    isSpeaking
                      ? "text-primary animate-pulse"
                      : "text-muted-foreground"
                  }
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
