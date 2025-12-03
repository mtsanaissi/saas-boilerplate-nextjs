import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS Boilerplate",
  description: "Next.js, Supabase, Stripe, Tailwind v4 & DaisyUI",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base-200 min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="navbar bg-base-100 border-b border-base-300 px-4">
            <div className="flex-1">
              <Link href="/" className="btn btn-ghost normal-case text-xl">
                SaaS Boilerplate
              </Link>
            </div>
            <div className="flex-none gap-2">
              <Link href="/plans" className="btn btn-ghost btn-sm">
                Plans
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="btn btn-ghost btn-sm">
                    Dashboard
                  </Link>
                  <form action={signOut}>
                    <button type="submit" className="btn btn-outline btn-sm">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-ghost btn-sm">
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="btn btn-primary btn-sm"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
