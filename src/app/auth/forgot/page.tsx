import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function ForgotRedirectPage() {
  redirect(`/${routing.defaultLocale}/auth/forgot`);
}
