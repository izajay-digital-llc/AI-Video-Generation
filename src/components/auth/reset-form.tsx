"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { updatePassword, type AuthState } from "@/app/(auth)/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { FormAlert } from "./form-alert";
import { PasswordField } from "./password-field";

export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});

  if (state.success) {
    return (
      <div className="flex flex-col items-start gap-5" role="status">
        <span className="grid size-12 place-items-center rounded-2xl border border-line-strong bg-raised">
          <ShieldCheck className="size-5 text-success" />
        </span>
        <div>
          <h2 className="font-display text-[36px] leading-none tracking-tight">Password updated</h2>
          <p className="mt-3 text-[15px] text-fg-muted">You&apos;re signed in and ready to create.</p>
        </div>
        <Link href="/create" className={buttonClasses("primary", "lg", "w-full")}>
          Go to the studio
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && (
        <FormAlert>
          {state.error}{" "}
          {state.error.includes("expired") && (
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
          )}
        </FormAlert>
      )}
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={state.fieldErrors?.password}
        showStrength
        autoFocus
        required
      />
      <PasswordField
        label="Confirm new password"
        name="confirm"
        autoComplete="new-password"
        placeholder="Type it again"
        error={state.fieldErrors?.confirm}
        required
      />
      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
