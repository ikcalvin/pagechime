"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signup } from "../actions";
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
import { AuthErrorMessage } from "../login/auth-error-message";
import { OAuthSignin } from "../oauth-signin";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full h-10" disabled={pending}>
      {pending ? "Signing Up..." : "Sign Up"}
    </Button>
  );
}

import { toast } from "sonner";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const [state, formAction] = useActionState(signup, { error: null });
  const router = useRouter();

  useEffect(() => {
    if (state?.message) {
      toast.success(state.message);
      // Optional: Redirect to login after a delay or just let them read the toast
      // router.push("/login");
    }
  }, [state?.message, router]);

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
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={formAction} className="grid gap-4">
            {state?.error && <AuthErrorMessage message={state.error} />}
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
            <div className="grid gap-2">
              <Label htmlFor="password" className="sr-only">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
                className="h-10"
              />
            </div>
            <SubmitButton />
          </form>
          <OAuthSignin />
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary underline-offset-4 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>

      <p className="px-8 text-center text-sm text-muted-foreground mt-4">
        By clicking &apos;Sign Up&apos;, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
