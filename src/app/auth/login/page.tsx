import Link from "next/link";
import { AuthCard } from "@/components/features/auth/AuthCard";
import { signInWithEmail } from "@/app/auth/actions";
import { safeDecodeURIComponent } from "@/lib/url";

interface LoginPageProps {
  searchParams?: Promise<{ error?: string; redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const redirectTo = resolvedSearchParams.redirect;

  const errorMessage =
    errorCode === "invalid_credentials"
      ? "The email or password you entered is incorrect."
      : null;

  return (
    <AuthCard
      title="Sign in"
      subtitle="Access your dashboard and manage your subscription."
    >
      {errorMessage ? (
        <div className="alert alert-error text-sm">
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form action={signInWithEmail} className="space-y-4">
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}
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
            className="input input-bordered w-full"
            autoComplete="current-password"
          />
        </div>

        <div className="form-control mt-6">
          <button type="submit" className="btn btn-primary w-full">
            Continue
          </button>
        </div>
      </form>

      <div className="divider text-xs uppercase">Or</div>

      <p className="text-sm text-center text-base-content/70">
        New here?{" "}
        <Link href="/auth/register" className="link link-primary font-medium">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
