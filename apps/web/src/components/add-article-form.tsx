"use client";

import React, { useState } from "react";
import { Plus, Loader2, Link2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AddArticleDialogProps {
  children?: React.ReactNode;
}

type FormState = "idle" | "error" | "loading" | "success";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function AddArticleDialog({ children }: AddArticleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function resetForm() {
    setUrl("");
    setFormState("idle");
    setErrorMessage("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Delay reset so the closing animation can play out
      setTimeout(resetForm, 200);
    }
    setOpen(next);
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrl(e.target.value);
    // Clear error as soon as the user starts editing
    if (formState === "error") {
      setFormState("idle");
      setErrorMessage("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = url.trim();

    if (!trimmed) return;

    if (!isValidUrl(trimmed)) {
      setFormState("error");
      setErrorMessage("Please enter a valid URL");
      return;
    }

    setFormState("loading");
    setErrorMessage("");

    try {
      await api.post("/articles", { url: trimmed });

      setFormState("success");

      toast.success("Article added!", {
        description: "Your article has been saved and is ready to read.",
      });

      // Brief pause to show the success checkmark, then close
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 900);
    } catch (err: unknown) {
      setFormState("error");
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
      toast.error("Failed to add article", { description: message });
    }
  }

  const isLoading = formState === "loading";
  const isSuccess = formState === "success";
  const hasError = formState === "error";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Article
          </Button>
        )}
      </DialogTrigger>

      {/*
        Custom overlay with blur backdrop.
        DialogContent from shadcn/ui typically renders its own overlay;
        if your DialogContent already includes an overlay, replace it with
        the version below that accepts an overlayClassName prop, or add
        the overlay manually outside DialogContent.
      */}
      <DialogContent
        className={cn(
          // Size & shape
          "max-w-[480px] w-full rounded-2xl p-6",
          // Animation: scale + fade
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "duration-200"
        )}
        // Pass blur overlay styles via the overlay slot if your Dialog
        // implementation exposes overlayClassName; otherwise set it in
        // globals.css or wrap DialogOverlay manually.
        //
        // For a plain Radix setup without shadcn wrappers, replace this
        // with the snippet in the comment block below.
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-semibold">Add Article</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Paste any URL and we&apos;ll save it for you to read and listen to later.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 animate-in zoom-in-50 duration-300" />
            <p className="text-sm font-medium text-foreground">Article saved!</p>
          </div>
        ) : (
          /* ── Default / Error / Loading state ── */
          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
            <div className="space-y-1.5">
              {/* Input with icon prefix */}
              <div className="relative">
                <Link2
                  className={cn(
                    "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors",
                    hasError ? "text-destructive" : "text-muted-foreground"
                  )}
                  aria-hidden
                />
                <Input
                  id="article-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  autoFocus
                  placeholder="Paste a link..."
                  value={url}
                  onChange={handleUrlChange}
                  disabled={isLoading}
                  className={cn(
                    "h-12 rounded-xl text-base pl-10 pr-4 transition-colors",
                    hasError &&
                      "border-destructive focus-visible:ring-destructive/30"
                  )}
                  aria-describedby={hasError ? "url-error" : undefined}
                  aria-invalid={hasError}
                />
              </div>

              {/* Inline error message */}
              {hasError && errorMessage && (
                <p
                  id="url-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errorMessage}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Article
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/*
  ──────────────────────────────────────────────────────────────────────────────
  NOTE: Blur backdrop

  If your project's <DialogContent> (shadcn/ui) wraps <DialogOverlay> internally
  and does NOT expose an overlayClassName prop, add this to your globals.css:

    [data-radix-dialog-overlay] {
      @apply bg-black/40 backdrop-blur-sm;
    }

  Or, if you have a custom DialogContent in /components/ui/dialog.tsx, find the
  <DialogOverlay> rendered inside it and add the classes directly:

    <DialogOverlay className="bg-black/40 backdrop-blur-sm" />

  The component above is otherwise self-contained and production-ready.
  ──────────────────────────────────────────────────────────────────────────────
*/
