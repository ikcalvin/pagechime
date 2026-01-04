"use client";

import { useEffect } from "react";
import { deleteAuthErrorCookie } from "../actions";

export function AuthErrorMessage({ message }: { message: string }) {
  useEffect(() => {
    if (message) {
      deleteAuthErrorCookie();
    }
  }, [message]);

  if (!message) return null;

  return <div className="text-red-500 text-sm text-center mb-4">{message}</div>;
}
