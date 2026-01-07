"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { deleteAuthErrorCookie } from "../actions";

export function AuthErrorMessage({ message }: { message: string }) {
  const lastShownMessage = useRef<string | null>(null);

  useEffect(() => {
    if (message && message !== lastShownMessage.current) {
      toast.error(message);
      lastShownMessage.current = message;
      deleteAuthErrorCookie();
    }
  }, [message]);

  return null;
}
