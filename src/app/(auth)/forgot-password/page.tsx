import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { error } = await searchParams;
  return (
    <>
      <AuthHeading title="Forgot password?" subtitle="Enter your email and we'll send you a reset link." />
      <ForgotForm linkError={error === "link"} />
    </>
  );
}
