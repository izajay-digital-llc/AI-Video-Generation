"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { FormAlert } from "./form-alert";
import { PasswordField } from "./password-field";

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error ? (
        <FormAlert>{state.error}</FormAlert>
      ) : linkError ? (
        <FormAlert>That link is invalid or has expired. Sign in, or request a new one.</FormAlert>
      ) : null}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@studio.com"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        autoFocus
        required
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={state.fieldErrors?.password}
        required
        trailing={
          <Link href="/forgot-password" className="text-[13px] text-fg-muted underline-offset-4 hover:text-accent hover:underline">
            Forgot password?
          </Link>
        }
      />

      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-fg-muted">
        New to Frameshift?{" "}
        <Link href="/signup" className="font-medium text-fg underline-offset-4 hover:text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
