"use client";

import Link from "next/link";
import { useActionState } from "react";
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
import { Alert } from "@/components/ui/alert";
import type { ActionState } from "@/lib/actions/auth";

type AuthFormProps = {
  mode: "login" | "register";
  action: (
    prevState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="gap-2 pt-2">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          {mode === "login" ? "Sign in" : "Register"}
        </p>
        <CardTitle className="font-heading text-2xl tracking-tight">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to manage shared expenses."
            : "Register to start splitting expenses with friends."}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <Alert variant="destructive">{state.error}</Alert>
          )}
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Your name" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "register" ? 8 : 1}
              placeholder="••••••••"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending}
          >
            {pending
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                No account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
