"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { FormAlert } from "./form-alert";
import { CheckInbox } from "./signup-form";

export function ForgotForm({ linkError }: { linkError?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});

  if (state.success) return <CheckInbox email={state.email} kind="reset" />;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error ? (
        <FormAlert>{state.error}</FormAlert>
      ) : linkError ? (
        <FormAlert>That reset link is invalid or has expired. Request a fresh one below.</FormAlert>
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
      <Button type="submit" size="lg" loading={pending} className="w-full">
        {pending ? "Sending link…" : "Send reset link"}
      </Button>
      <Link href="/login" className="text-center text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
        ← Back to sign in
      </Link>
    </form>
  );
}
