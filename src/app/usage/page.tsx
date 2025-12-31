import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function UsageRedirectPage() {
  redirect(`/${routing.defaultLocale}/usage`);
}
