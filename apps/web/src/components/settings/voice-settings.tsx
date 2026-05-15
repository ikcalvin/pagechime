"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, Volume2 } from "lucide-react";

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
      if (typeof window !== "undefined" && window.speechSynthesis) {
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
    if (voice) utterance.voice = voice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">
          Voice & Audio
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Preferences for the article reader.
        </p>
      </div>

      <div className="space-y-0 divide-y divide-border/50">
        {/* Reader Voice */}
        <div className="flex items-center justify-between py-3.5 gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Reader Voice</p>
              {!isSpeechSupported ? (
                <p className="text-sm text-muted-foreground italic">
                  Speech not supported in this browser.
                </p>
              ) : (
                <select
                  aria-label="Select Voice"
                  className="mt-1 flex h-9 w-full max-w-xs rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              )}
            </div>
          </div>
          {isSpeechSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              aria-label={isSpeaking ? "Stop preview" : "Preview voice"}
              className="shrink-0 h-8 text-xs gap-1.5"
            >
              {isSpeaking ? (
                <>
                  <PauseCircle className="h-3.5 w-3.5" />
                  Stop
                </>
              ) : (
                <>
                  <PlayCircle className="h-3.5 w-3.5" />
                  Preview
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
