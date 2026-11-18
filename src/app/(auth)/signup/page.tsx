import type { Metadata } from "next";
import { AuthHeading } from "@/components/auth/auth-heading";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <AuthHeading
        title={<>Start <em className="text-gradient">creating</em></>}
        subtitle="Make your first AI video in under a minute."
      />
      <SignupForm />
    </>
  );
}
