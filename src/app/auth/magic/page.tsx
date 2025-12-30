import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function MagicRedirectPage() {
  redirect(`/${routing.defaultLocale}/auth/magic`);
}
