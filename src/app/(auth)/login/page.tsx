import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <AuthHeading title="Welcome back" subtitle="Sign in to pick up where you left off." />
      <LoginForm next={typeof next === "string" ? next : undefined} linkError={error === "link"} />
    </>
  );
}
