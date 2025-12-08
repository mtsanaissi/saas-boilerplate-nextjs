import "next-intl";
import type messages from "@/messages/en";
import type { routing } from "@/i18n/routing";

type Messages = typeof messages;

declare module "next-intl" {
  interface AppConfig {
    Messages: Messages;
    Locale: (typeof routing.locales)[number];
  }
}
