import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

interface DevLinkCardProps {
  href: string;
  locale: AppLocale;
  title: string;
  description: string;
}

export function DevLinkCard({
  href,
  locale,
  title,
  description,
}: DevLinkCardProps) {
  return (
    <Link
      href={href}
      locale={locale}
      className="card bg-base-100 border border-base-300 hover:border-base-content/30 transition-colors"
    >
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </Link>
  );
}
