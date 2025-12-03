import Link from "next/link";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { signUpWithEmail } from "@/app/auth/actions";
import { safeDecodeURIComponent } from "@/lib/url";

interface RegisterPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);

  let errorMessage: string | null = null;

  if (errorCode === "invalid_credentials") {
    errorMessage = "Please provide a valid email and password.";
  } else if (errorCode === "signup_failed") {
    errorMessage =
      "We could not create your account. Please try again in a moment.";
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Set up your workspace in a few seconds."
    >
      {errorMessage ? (
        <div className="alert alert-error text-sm">
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form action={signUpWithEmail} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            type="email"
            name="email"
            required
            className="input input-bordered w-full"
            autoComplete="email"
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="input input-bordered w-full"
            autoComplete="new-password"
          />
          <label className="label">
            <span className="label-text-alt text-xs text-base-content/70">
              Minimum 8 characters. Use a strong unique password.
            </span>
          </label>
        </div>

        <div className="form-control mt-6">
          <button type="submit" className="btn btn-primary w-full">
            Create account
          </button>
        </div>
      </form>

      <p className="text-sm text-center text-base-content/70">
        Already have an account?{" "}
        <Link href="/auth/login" className="link link-primary font-medium">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
