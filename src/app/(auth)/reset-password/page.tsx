import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading title="New password" subtitle="Choose a strong password you don't use anywhere else." />
      <ResetForm />
    </>
  );
}
