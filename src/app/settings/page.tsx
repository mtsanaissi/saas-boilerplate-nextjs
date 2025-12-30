import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function SettingsRedirectPage() {
  redirect(`/${routing.defaultLocale}/settings`);
}
