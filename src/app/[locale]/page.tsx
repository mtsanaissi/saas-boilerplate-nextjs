import { HealthCheck } from "@/components/features/system/health-check";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

interface HomePageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const [tHero, tTech] = await Promise.all([
    getTranslations("home.hero"),
    getTranslations("home.techStack"),
  ]);
  const techItems = tTech.raw("items") as string[];

  return (
    <div className="bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="hero max-w-5xl mx-auto">
        <div className="hero-content flex-col lg:flex-row gap-12">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              {tHero("title")}
            </h1>
            <p className="py-6 text-lg text-base-content/80 max-w-md">
              {tHero("description")}
            </p>
            <div className="flex gap-2 justify-center lg:justify-start">
              <Link
                href="/auth/register"
                locale={locale}
                className="btn btn-primary"
              >
                {tHero("primaryCta")}
              </Link>
              <Link href="/plans" locale={locale} className="btn btn-ghost">
                {tHero("secondaryCta")}
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <HealthCheck />

            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h2 className="card-title">{tTech("title")}</h2>
                <ul className="list-disc list-inside text-sm text-base-content/80 space-y-1">
                  {techItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-base-content/50 font-mono">
        {tHero("footer")}
      </p>
    </div>
  );
}
