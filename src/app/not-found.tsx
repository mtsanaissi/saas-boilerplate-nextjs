import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default async function NotFound() {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "system.notFound",
  });

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="card bg-base-100 w-full max-w-lg shadow-2xl border border-base-300">
        <div className="card-body gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-base-content/70">{t("subtitle")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${routing.defaultLocale}`}
              className="btn btn-primary btn-sm"
            >
              {t("goHome")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
