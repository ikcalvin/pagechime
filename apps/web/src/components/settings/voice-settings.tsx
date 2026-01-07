"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

export function VoiceSettings() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const hasInitializedRef = useRef(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);

  useEffect(() => {
    setIsSpeechSupported(
      typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        "SpeechSynthesisUtterance" in window
    );
  }, []);

  useEffect(() => {
    if (!isSpeechSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !hasInitializedRef.current) {
        const defaultVoice =
          availableVoices.find((v) => v.default) || availableVoices[0];
        setSelectedVoice(defaultVoice.name);
        hasInitializedRef.current = true;
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSpeechSupported]);
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePreview = () => {
    if (!isSpeechSupported) return;

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
    utterance.onerror = () => setIsSpeaking(false);

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
              {!isSpeechSupported ? (
                <div className="text-sm text-muted-foreground italic">
                  Speech not supported in this browser.
                </div>
              ) : (
                <>
                  <select
                    aria-label="Select Voice"
                    className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedVoice}
                    onChange={(e) => {
                      setSelectedVoice(e.target.value);
                      hasInitializedRef.current = true;
                    }}
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
                    aria-label={isSpeaking ? "Stop preview" : "Preview voice"}
                    aria-pressed={isSpeaking}
                    title={isSpeaking ? "Stop preview" : "Preview voice"}
                  >
                    <PlayCircle
                      className={
                        isSpeaking
                          ? "text-primary animate-pulse"
                          : "text-muted-foreground"
                      }
                    />
                  </Button>{" "}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
