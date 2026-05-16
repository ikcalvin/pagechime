"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Copy,
  Check,
  Mail,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/utils/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NewsletterSource = {
  id: string;
  sender_name: string;
  sender_email: string;
  logo_url?: string;
  is_active: boolean;
  issue_count: number;
  last_received_at: string | null;
};

type ForwardingAddress = {
  email: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

const avatarColors = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-teal-500",
];

function colorForSource(sourceId: string): string {
  let hash = 0;
  for (let i = 0; i < sourceId.length; i++) {
    hash = sourceId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewsletterSources() {
  const router = useRouter();

  // Data
  const [sources, setSources] = useState<NewsletterSource[]>([]);
  const [forwardingAddress, setForwardingAddress] =
    useState<ForwardingAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch data
  // -------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sourcesRes, addressRes] = await Promise.allSettled([
        api.get("/newsletters/sources"),
        api.get("/newsletters/forwarding-address"),
      ]);

      if (sourcesRes.status === "fulfilled") {
        const data = sourcesRes.value.data;
        setSources(Array.isArray(data) ? data : data.data ?? []);
      }

      if (addressRes.status === "fulfilled") {
        setForwardingAddress(addressRes.value.data);
      }
    } catch {
      // Endpoints may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleCopyAddress = useCallback(async () => {
    if (!forwardingAddress) return;
    await navigator.clipboard.writeText(forwardingAddress.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [forwardingAddress]);

  const handleToggleSource = useCallback(
    async (source: NewsletterSource) => {
      try {
        await api.patch(`/newsletters/sources/${source.id}`, {
          is_active: !source.is_active,
        });
        setSources((prev) =>
          prev.map((s) =>
            s.id === source.id ? { ...s, is_active: !s.is_active } : s
          )
        );
      } catch {
        // Surface error in production
      }
    },
    []
  );

  const handleDeleteSource = useCallback(
    async (source: NewsletterSource) => {
      const confirmed = window.confirm(
        `Remove ${source.sender_name}? You will stop receiving their newsletters.`
      );
      if (!confirmed) return;
      try {
        await api.delete(`/newsletters/sources/${source.id}`);
        setSources((prev) => prev.filter((s) => s.id !== source.id));
      } catch {
        // Surface error in production
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-[#FF6B4A]" />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/newsletters")}
          aria-label="Back to newsletters"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Newsletter Sources
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your newsletter subscriptions and forwarding address
          </p>
        </div>
      </div>

      {/* Forwarding Address Card */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B4A]/10">
            <Mail className="h-5 w-5 text-[#FF6B4A]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Your Forwarding Address
            </h2>
            <p className="text-sm text-muted-foreground">
              Forward your newsletters to this address to have them processed by
              PageChime
            </p>
          </div>
        </div>

        {forwardingAddress ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-mono text-foreground select-all">
              {forwardingAddress.email}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAddress}
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            Your forwarding address will appear here once your account is set
            up.
          </div>
        )}
      </div>

      {/* Sources List */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Connected Sources ({sources.length})
        </h2>

        {sources.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border bg-card">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted mb-3">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No sources yet
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Forward a newsletter to your PageChime address and it will appear
              here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sources.map((source) => (
              <div
                key={source.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors",
                  source.is_active
                    ? "hover:bg-muted/50"
                    : "opacity-60 hover:bg-muted/30"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold",
                    colorForSource(source.id)
                  )}
                >
                  {source.logo_url ? (
                    <img
                      src={source.logo_url}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(source.sender_name)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">
                      {source.sender_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {source.issue_count}{" "}
                      {source.issue_count === 1 ? "issue" : "issues"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {source.sender_email}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggleSource(source)}
                  aria-label={
                    source.is_active
                      ? `Disable ${source.sender_name}`
                      : `Enable ${source.sender_name}`
                  }
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {source.is_active ? (
                    <ToggleRight className="h-6 w-6 text-[#FF6B4A]" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSource(source)}
                  aria-label={`Remove ${source.sender_name}`}
                  className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
