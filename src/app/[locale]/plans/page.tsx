import { createClient } from "@/lib/supabase/server";
import { plans } from "@/lib/stripe/plans";
import { createCheckoutSession } from "@/app/plans/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import messages from "@/messages/en";
import type { AppLocale } from "@/i18n/routing";
import { getErrorMessageKey } from "@/lib/errors";
import type { PlanId, PlanStatus } from "@/types/billing";
import type { UserProfile } from "@/types/profile";
import { createBillingPortalSession } from "@/app/billing/actions";

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
  const { locale } = await params;
  const [resolvedSearchParams, supabase, tPage, tAlerts, tErrors] =
    await Promise.all([
      searchParams ?? Promise.resolve<PlansSearchParams>({}),
      createClient(),
      getTranslations({ locale, namespace: "plans.page" }),
      getTranslations({ locale, namespace: "plans.alerts" }),
      getTranslations({ locale, namespace: "errors" }),
    ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("plan_id, plan_status")
        .eq("id", user.id)
        .maybeSingle<UserProfile>()
    : { data: null };

  const hasSuccess = resolvedSearchParams.success === "1";
  const hasCanceled = resolvedSearchParams.canceled === "1";
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);

  const errorKey = getErrorMessageKey(errorCode);
  const errorMessage = errorKey ? tErrors(errorKey) : null;

  const cards = messages.plans.cards;
  const planId = (profile?.plan_id as PlanId) ?? "free";
  const planStatus = (profile?.plan_status as PlanStatus) ?? "free";
  const isActiveStarter =
    planId === "starter" &&
    (planStatus === "trialing" || planStatus === "active");

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
          <div
            className="alert alert-success text-sm"
            role="status"
            aria-live="polite"
          >
            <span>{tAlerts("success")}</span>
          </div>
        ) : null}

        {hasCanceled ? (
          <div
            className="alert alert-info text-sm"
            role="status"
            aria-live="polite"
          >
            <span>{tAlerts("canceled")}</span>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            className="alert alert-error text-sm"
            role="alert"
            aria-live="assertive"
          >
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {!user ? (
          <div
            className="alert alert-warning text-sm"
            role="status"
            aria-live="polite"
          >
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

        {user ? (
          <div
            className="alert alert-info text-sm"
            role="status"
            aria-live="polite"
          >
            <span>
              {tPage("billingChangePrefix")}{" "}
              <Link
                href="/settings#billing"
                locale={locale}
                className="link link-primary font-medium"
              >
                {tPage("billingChangeLink")}
              </Link>{" "}
              {tPage("billingChangeSuffix")}
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
                      <span>{tPage("priceFree")}</span>
                    ) : (
                      <>
                        <span>${plan.priceMonthly}</span>
                        <span className="text-sm font-normal text-base-content/60">
                          {tPage("perMonthSuffix")}
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
                      isActiveStarter ? (
                        <form
                          action={createBillingPortalSession}
                          className="w-full"
                        >
                          <input type="hidden" name="locale" value={locale} />
                          <button
                            type="submit"
                            className="btn btn-outline w-full"
                          >
                            {cards.free.ctaDowngrade}
                          </button>
                        </form>
                      ) : (
                        <Link
                          href={user ? "/dashboard" : "/auth/register"}
                          locale={locale}
                          className="btn btn-outline w-full"
                        >
                          {user
                            ? cards.free.ctaSignedIn
                            : cards.free.ctaSignedOut}
                        </Link>
                      )
                    ) : plan.id === "starter" && isActiveStarter ? (
                      <Link
                        href="/dashboard"
                        locale={locale}
                        className="btn btn-primary w-full"
                      >
                        {cards.starter.ctaActive}
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
