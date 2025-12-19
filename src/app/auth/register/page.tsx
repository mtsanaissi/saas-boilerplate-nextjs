import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function RegisterRedirectPage() {
  redirect(`/${routing.defaultLocale}/auth/register`);
}
