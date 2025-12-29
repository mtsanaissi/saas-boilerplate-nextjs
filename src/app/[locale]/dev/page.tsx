import { DevLinkCard } from "@/components/features/dev/DevLinkCard";
import { notFound } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";

interface DevIndexPageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function DevIndexPage({ params }: DevIndexPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { locale } = await params;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Dev playground</h1>
        <p className="opacity-80">
          Placeholder pages to exercise accessibility, forms/alerts, focus
          styles, and error states.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DevLinkCard
          locale={locale}
          href="/dev/a11y"
          title="A11y surface"
          description="Landmarks/headings checklist, focusable controls, and contrast samples."
        />
        <DevLinkCard
          locale={locale}
          href="/dev/forms"
          title="Forms + alerts"
          description="Inputs, validation states, and live region placeholders."
        />
        <DevLinkCard
          locale={locale}
          href="/dev/errors"
          title="Error states"
          description="Query-param driven error codes to validate error-message mapping."
        />
      </div>
    </div>
  );
}
