import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { plans } from "@/lib/stripe/plans";
import { createCheckoutSession } from "@/app/plans/actions";
import { safeDecodeURIComponent } from "@/lib/url";

interface PlansPageProps {
  searchParams?: Promise<{
    success?: string;
    canceled?: string;
    error?: string;
  }>;
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resolvedSearchParams = (await searchParams) ?? {};

  const hasSuccess = resolvedSearchParams.success === "1";
  const hasCanceled = resolvedSearchParams.canceled === "1";
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);

  let errorMessage: string | null = null;

  if (errorCode === "invalid_plan") {
    errorMessage = "The selected plan is not valid.";
  } else if (errorCode === "plan_not_available") {
    errorMessage =
      "This plan is currently unavailable. Please choose another plan.";
  } else if (errorCode === "checkout_unavailable") {
    errorMessage = "We could not start the checkout session. Please try again.";
  }

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2 items-start">
          <h1 className="text-3xl font-semibold">Plans</h1>
          <p className="text-sm text-base-content/70 max-w-2xl">
            Choose the subscription that fits your stage. You can start on the
            Free tier and upgrade when you are ready.
          </p>
        </div>

        {hasSuccess ? (
          <div className="alert alert-success text-sm">
            <span>
              Your payment was successful. Your subscription will be updated
              once the webhook is processed.
            </span>
          </div>
        ) : null}

        {hasCanceled ? (
          <div className="alert alert-info text-sm">
            <span>Checkout canceled. You have not been charged.</span>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="alert alert-error text-sm">
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {!user ? (
          <div className="alert alert-warning text-sm">
            <span>
              You need to{" "}
              <Link
                href="/auth/login?redirect=/plans"
                className="link link-primary font-medium"
              >
                sign in
              </Link>{" "}
              before subscribing so we can link your account.
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card bg-base-100 shadow-xl border border-base-300 flex flex-col"
            >
              <div className="card-body flex flex-col gap-4">
                <div>
                  <h2 className="card-title text-lg">{plan.name}</h2>
                  <p className="text-sm text-base-content/70">
                    {plan.description}
                  </p>
                  {plan.highlight ? (
                    <div className="mt-2 badge badge-primary badge-outline text-xs">
                      {plan.highlight}
                    </div>
                  ) : null}
                </div>

                <div className="text-3xl font-semibold">
                  {plan.priceMonthly === 0 ? (
                    <span>Free</span>
                  ) : (
                    <>
                      <span>${plan.priceMonthly}</span>
                      <span className="text-sm font-normal text-base-content/60">
                        /month
                      </span>
                    </>
                  )}
                </div>

                <ul className="text-sm text-base-content/80 space-y-1 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-1 text-success">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="card-actions mt-4">
                  {plan.id === "free" ? (
                    <Link
                      href={user ? "/dashboard" : "/auth/register"}
                      className="btn btn-outline w-full"
                    >
                      {user ? "Go to dashboard" : "Get started for free"}
                    </Link>
                  ) : (
                    <form action={createCheckoutSession} className="w-full">
                      <input type="hidden" name="planId" value={plan.id} />
                      <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={!user}
                      >
                        {user ? "Subscribe" : "Sign in to subscribe"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
