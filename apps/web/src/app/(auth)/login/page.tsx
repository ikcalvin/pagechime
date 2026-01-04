import { login, deleteAuthErrorCookie } from "../actions";
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

import { AuthErrorMessage } from "./auth-error-message";
import { cookies } from "next/headers";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const error = cookieStore.get("auth-error")?.value;

  if (error) {
    await deleteAuthErrorCookie();
  }

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
            Welcome back
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && <AuthErrorMessage message={error} />}
          <form className="grid gap-4">
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
            <Button formAction={login} className="w-full h-10">
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          <p className="text-xs text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>

      <p className="px-8 text-center text-sm text-muted-foreground mt-4">
        By clicking &apos;Sign In&apos;, you agree to our{" "}
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
