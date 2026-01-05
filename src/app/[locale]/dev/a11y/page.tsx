import { notFound } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

interface DevA11yPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ locale: AppLocale }>;
}

export default async function DevA11yPage({
  searchParams,
  params,
}: DevA11yPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const showLongContent = resolvedSearchParams.long === "1";
  const t = await getTranslations({ locale, namespace: "dev.a11y" });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="opacity-80">{t("intro")}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("focusableTitle")}</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button type="button" className="btn btn-primary">
            {t("focusable.primary")}
          </button>
          <button type="button" className="btn btn-outline">
            {t("focusable.outline")}
          </button>
          <button type="button" className="btn btn-ghost">
            {t("focusable.ghost")}
          </button>
          <a href="#contrast" className="link">
            {t("focusable.inPageLink")}
          </a>
          <label className="label cursor-pointer gap-2">
            <span className="label-text">{t("focusable.checkbox")}</span>
            <input type="checkbox" className="checkbox" />
          </label>
          <label className="label cursor-pointer gap-2">
            <span className="label-text">{t("focusable.toggle")}</span>
            <input type="checkbox" className="toggle" />
          </label>
        </div>
        <p className="text-sm opacity-80">{t("tip")}</p>
      </section>

      <section id="contrast" className="space-y-4">
        <h2 className="text-xl font-semibold">{t("contrastTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-box bg-base-100 border border-base-300">
            <p className="font-medium">{t("contrast.baseTitle")}</p>
            <p className="text-sm opacity-80">{t("contrast.baseBody")}</p>
          </div>
          <div className="p-4 rounded-box bg-primary text-primary-content">
            <p className="font-medium">{t("contrast.primaryTitle")}</p>
            <p className="text-sm opacity-90">{t("contrast.primaryBody")}</p>
          </div>
          <div className="p-4 rounded-box bg-success text-success-content">
            <p className="font-medium">{t("contrast.successTitle")}</p>
            <p className="text-sm opacity-90">{t("contrast.successBody")}</p>
          </div>
          <div className="p-4 rounded-box bg-error text-error-content">
            <p className="font-medium">{t("contrast.errorTitle")}</p>
            <p className="text-sm opacity-90">{t("contrast.errorBody")}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("headingsTitle")}</h2>
        <p className="opacity-80">{t("headingsBody")}</p>
        {showLongContent ? (
          <div className="space-y-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <p key={index} className="opacity-80">
                {t("longParagraph", { index: String(index + 1) })}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-80">
            {t.rich("longHint", {
              code: (chunks) => (
                <code className="px-1 rounded bg-base-300">{chunks}</code>
              ),
            })}
          </p>
        )}
      </section>
    </div>
  );
}
