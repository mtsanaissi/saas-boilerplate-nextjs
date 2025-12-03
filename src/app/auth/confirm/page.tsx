import Link from "next/link";
import { AuthCard } from "@/components/features/auth/AuthCard";

export default function ConfirmPage() {
  return (
    <AuthCard
      title="Check your inbox"
      subtitle="We have sent you a confirmation email. Click the link to verify your account."
    >
      <p className="text-sm text-base-content/70">
        Once your email is verified, you can sign in and access your dashboard.
      </p>
      <div className="mt-6 flex justify-between items-center text-sm">
        <Link href="/" className="link link-hover">
          Back to home
        </Link>
        <Link href="/auth/login" className="btn btn-sm btn-outline">
          Go to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
