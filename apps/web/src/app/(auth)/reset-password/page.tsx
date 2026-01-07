"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { updatePassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full h-10" disabled={pending}>
      {pending ? "Updating..." : "Update Password"}
    </Button>
  );
}

import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, formAction] = useActionState(updatePassword, { error: null });
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/login"); // Redirect to login
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Link href="/">
          <Image
            src="/pagechime_logo_black.svg"
            alt="PageChime"
            width={150}
            height={46}
            className="h-10 w-auto dark:hidden"
            priority
          />
          <Image
            src="/pagechime_logo_white.svg"
            alt="PageChime"
            width={150}
            height={46}
            className="h-10 w-auto hidden dark:block"
            priority
          />
        </Link>
      </div>

      <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm bg-transparent sm:bg-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={formAction} className="grid gap-4">
            {state?.success && (
              <div
                className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600"
                role="alert"
                aria-atomic="true"
              >
                {state.message}
              </div>
            )}
            {state?.error && (
              <div
                className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600"
                role="alert"
                aria-atomic="true"
              >
                {state.error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="password" className="sr-only">
                New Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="New Password"
                required
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                required
                className="h-10"
              />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
