"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext, siteOrigin } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirm", string>>;
  success?: boolean;
  email?: string;
};

const email = z.string().trim().toLowerCase().email("Enter a valid email address.");
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match.";
  if (m.includes("email not confirmed")) return "Confirm your email first — check your inbox for the link.";
  if (m.includes("rate limit") || m.includes("security purposes"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("same as the old") || m.includes("different from the old"))
    return "Choose a password you haven't used before.";
  if (m.includes("weak") || m.includes("pwned")) return "That password is too easy to guess. Try a longer one.";
  return "Something went wrong. Please try again.";
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "Enter your password.") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { email: f.email?.[0], password: f.password?.[0] }, email: String(formData.get("email") ?? "") };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendlyAuthError(error.message), email: parsed.data.email };

  redirect(safeNext(formData.get("next")?.toString()));
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ email, password })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { email: f.email?.[0], password: f.password?.[0] }, email: String(formData.get("email") ?? "") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/create` },
  });
  if (error) return { error: friendlyAuthError(error.message), email: parsed.data.email };

  // Email confirmation disabled → we already have a session.
  if (data.session) redirect("/create");

  return { success: true, email: parsed.data.email };
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { fieldErrors: { email: parsed.error.issues[0].message } };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  });
  if (error && /rate limit|security purposes/i.test(error.message)) {
    return { error: friendlyAuthError(error.message), email: parsed.data };
  }
  // Always report success so the form can't be used to discover accounts.
  return { success: true, email: parsed.data };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "Passwords don't match.", path: ["confirm"] })
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { password: f.password?.[0], confirm: f.confirm?.[0] } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (/session/i.test(error.message))
      return { error: "Your reset link has expired. Request a new one." };
    return { error: friendlyAuthError(error.message) };
  }
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
