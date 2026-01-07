"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { forgotPassword } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full h-10" disabled={pending}>
      {pending ? "Sending Link..." : "Send Reset Link"}
    </Button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPassword, { error: null });

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
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={formAction} className="grid gap-4">
            {state?.error && (
              <div
                className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600"
                role="alert"
                aria-atomic="true"
              >
                {state.error}
              </div>
            )}
            {state?.message && (
              <div
                className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600"
                role="alert"
                aria-atomic="true"
              >
                {state.message}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                required
                className="h-10"
              />
            </div>
            <SubmitButton />
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs text-center text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
