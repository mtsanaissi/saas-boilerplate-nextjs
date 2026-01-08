export interface NavLabels {
  primaryNavLabel: string;
  menuToggleLabel: string;
  plans: string;
  dev: string;
  dashboard: string;
  settings: string;
  signIn: string;
  signOut: string;
  getStarted: string;
}

import { routing } from "@/i18n/routing";

export type AppLocale = (typeof routing.locales)[number];

export interface NavbarProps {
  appLocale: AppLocale;
  appName: string;
  labels: NavLabels;
  showDevLinks: boolean;
  isAuthenticated: boolean;
}
