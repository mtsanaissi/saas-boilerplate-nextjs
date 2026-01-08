"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/app/auth/actions";
import type { NavbarProps } from "@/types/navigation";

export default function Navbar({
  appLocale,
  appName,
  labels,
  showDevLinks,
  isAuthenticated,
}: NavbarProps) {
  const dropdownId = useId();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current) {
        return;
      }
      const targetNode = event.target as Node | null;
      if (targetNode && dropdownRef.current.contains(targetNode)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const handleMenuToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMenuAction = (event: MouseEvent<HTMLUListElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (target.closest("a,button")) {
      setIsOpen(false);
    }
  };

  return (
    <nav className="navbar" aria-label={labels.primaryNavLabel}>
      <div className="flex-1">
        <Link
          href="/"
          locale={appLocale}
          className="btn btn-ghost normal-case text-xl"
        >
          {appName}
        </Link>
      </div>

      <div className="flex-none lg:hidden" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            aria-label={labels.menuToggleLabel}
            aria-expanded={isOpen}
            aria-controls={dropdownId}
            className="btn btn-ghost btn-square"
            onClick={handleMenuToggle}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>

          <ul
            id={dropdownId}
            onClick={handleMenuAction}
            className={`menu menu-sm absolute right-0 z-30 mt-3 w-56 rounded-box bg-base-100 p-2 shadow ${
              isOpen ? "block" : "hidden"
            }`}
          >
            <li>
              <Link href="/plans" locale={appLocale}>
                {labels.plans}
              </Link>
            </li>
            {showDevLinks ? (
              <li>
                <Link href="/dev" locale={appLocale}>
                  {labels.dev}
                </Link>
              </li>
            ) : null}
            {isAuthenticated ? (
              <>
                <li>
                  <Link href="/dashboard" locale={appLocale}>
                    {labels.dashboard}
                  </Link>
                </li>
                <li>
                  <Link href="/settings" locale={appLocale}>
                    {labels.settings}
                  </Link>
                </li>
                <li>
                  <form action={signOut} className="w-full">
                    <button
                      type="submit"
                      className="btn btn-ghost btn-sm w-full justify-start"
                    >
                      {labels.signOut}
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/auth/login" locale={appLocale}>
                    {labels.signIn}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/register"
                    locale={appLocale}
                    className="btn btn-primary btn-sm"
                  >
                    {labels.getStarted}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="hidden flex-none items-center gap-2 lg:flex">
        <Link href="/plans" locale={appLocale} className="btn btn-ghost btn-sm">
          {labels.plans}
        </Link>
        {showDevLinks ? (
          <Link href="/dev" locale={appLocale} className="btn btn-ghost btn-sm">
            {labels.dev}
          </Link>
        ) : null}
        {isAuthenticated ? (
          <>
            <Link
              href="/dashboard"
              locale={appLocale}
              className="btn btn-ghost btn-sm"
            >
              {labels.dashboard}
            </Link>
            <Link
              href="/settings"
              locale={appLocale}
              className="btn btn-ghost btn-sm"
            >
              {labels.settings}
            </Link>
            <form action={signOut} className="flex items-center">
              <button type="submit" className="btn btn-outline btn-sm">
                {labels.signOut}
              </button>
            </form>
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              locale={appLocale}
              className="btn btn-ghost btn-sm"
            >
              {labels.signIn}
            </Link>
            <Link
              href="/auth/register"
              locale={appLocale}
              className="btn btn-primary btn-sm"
            >
              {labels.getStarted}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
