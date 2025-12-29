import { HealthCheck } from "@/components/features/system/health-check";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("home.hero");

  return (
    <div className="bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="hero max-w-5xl mx-auto">
        <div className="hero-content flex-col lg:flex-row gap-12">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t("title")}
            </h1>
            <p className="py-6 text-lg text-base-content/80 max-w-md">
              {t("description")}
            </p>
            <div className="flex gap-2 justify-center lg:justify-start">
              <Link
                href="/auth/register"
                locale={locale}
                className="btn btn-primary"
              >
                {t("primaryCta")}
              </Link>
              <Link href="/plans" locale={locale} className="btn btn-ghost">
                {t("secondaryCta")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <HealthCheck />

            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h2 className="card-title">Tech Stack</h2>
                <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                  <li>Next.js 16 (App Router)</li>
                  <li>Tailwind CSS v4 (Alpha)</li>
                  <li>DaisyUI v5</li>
                  <li>Supabase (Docker)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-base-content/50 font-mono">
        {t("footer")}
      </p>
    </div>
  );
}
