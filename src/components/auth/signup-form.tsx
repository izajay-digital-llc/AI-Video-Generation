"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { signup, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { FormAlert } from "./form-alert";
import { PasswordField } from "./password-field";

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, {});

  if (state.success) {
    return <CheckInbox email={state.email} kind="confirm" />;
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={state.fieldErrors?.password}
        showStrength
        required
      />
      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-fg underline-offset-4 hover:text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function CheckInbox({ email, kind }: { email?: string; kind: "confirm" | "reset" }) {
  return (
    <div className="flex flex-col items-start gap-5" role="status">
      <span className="grid size-12 place-items-center rounded-2xl border border-line-strong bg-raised">
        <MailCheck className="size-5 text-accent" />
      </span>
      <div>
        <h2 className="font-display text-[36px] leading-none tracking-tight">Check your inbox</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
          {kind === "confirm" ? "We sent a confirmation link to " : "If an account exists for "}
          <span className="font-medium text-fg">{email}</span>
          {kind === "confirm"
            ? ". Open it on this device to activate your account."
            : ", you'll get a link to choose a new password. It expires in one hour."}
        </p>
      </div>
      <p className="text-sm text-fg-subtle">
        Didn&apos;t get it? Check spam, or{" "}
        {/* Plain anchor: a full reload resets the form state. */}
        <a href={kind === "confirm" ? "/signup" : "/forgot-password"} className="text-fg-muted underline underline-offset-4 hover:text-accent">
          try again
        </a>
        .
      </p>
      <Link href="/login" className="text-sm font-medium text-fg underline-offset-4 hover:text-accent hover:underline">
        ← Back to sign in
      </Link>
    </div>
  );
}
