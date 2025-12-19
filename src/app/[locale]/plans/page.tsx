import { createClient } from "@/lib/supabase/server";
import { plans } from "@/lib/stripe/plans";
import { createCheckoutSession } from "@/app/plans/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import messages from "@/messages/en";
import type { AppLocale } from "@/i18n/routing";

type PlansSearchParams = {
  success?: string;
  canceled?: string;
  error?: string;
};

interface PlansPageProps {
  searchParams?: Promise<PlansSearchParams>;
  params: Promise<{ locale: AppLocale }>;
}

export default async function PlansPage({
  searchParams,
  params,
}: PlansPageProps) {
  const [{ locale }, resolvedSearchParams, supabase, tPage, tAlerts] =
    await Promise.all([
      params,
      searchParams ?? Promise.resolve<PlansSearchParams>({}),
      createClient(),
      getTranslations({ locale: "en", namespace: "plans.page" }),
      getTranslations({ locale: "en", namespace: "plans.alerts" }),
    ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasSuccess = resolvedSearchParams.success === "1";
  const hasCanceled = resolvedSearchParams.canceled === "1";
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);

  let errorMessage: string | null = null;

  if (errorCode === "invalid_plan") {
    errorMessage = tAlerts("invalidPlan");
  } else if (errorCode === "plan_not_available") {
    errorMessage = tAlerts("planNotAvailable");
  } else if (errorCode === "checkout_unavailable") {
    errorMessage = tAlerts("checkoutUnavailable");
  }

  const cards = messages.plans.cards;

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col gap-2 items-start">
          <h1 className="text-3xl font-semibold">{tPage("title")}</h1>
          <p className="text-sm text-base-content/70 max-w-2xl">
            {tPage("subtitle")}
          </p>
        </div>

        {hasSuccess ? (
          <div className="alert alert-success text-sm">
            <span>{tAlerts("success")}</span>
          </div>
        ) : null}

        {hasCanceled ? (
          <div className="alert alert-info text-sm">
            <span>{tAlerts("canceled")}</span>
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
              {tAlerts("mustSignInPrefix")}{" "}
              <Link
                href={{
                  pathname: "/auth/login",
                  query: { redirect: "/plans" },
                }}
                locale={locale}
                className="link link-primary font-medium"
              >
                {tAlerts("mustSignInLink")}
              </Link>{" "}
              {tAlerts("mustSignInSuffix")}
            </span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const card = cards[plan.id];

            return (
              <div
                key={plan.id}
                className="card bg-base-100 shadow-xl border border-base-300 flex flex-col"
              >
                <div className="card-body flex flex-col gap-4">
                  <div>
                    <h2 className="card-title text-lg">{card.name}</h2>
                    <p className="text-sm text-base-content/70">
                      {card.description}
                    </p>
                    {card.highlight ? (
                      <div className="mt-2 badge badge-primary badge-outline text-xs">
                        {card.highlight}
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
                    {card.features.map((feature) => (
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
                        locale={locale}
                        className="btn btn-outline w-full"
                      >
                        {user
                          ? cards.free.ctaSignedIn
                          : cards.free.ctaSignedOut}
                      </Link>
                    ) : (
                      <form action={createCheckoutSession} className="w-full">
                        <input type="hidden" name="planId" value={plan.id} />
                        <button
                          type="submit"
                          className="btn btn-primary w-full"
                          disabled={!user}
                        >
                          {user
                            ? cards[plan.id].cta
                            : cards[plan.id].ctaDisabled}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
