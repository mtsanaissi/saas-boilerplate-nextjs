"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type SettingsSection = {
  id: string;
  label: string;
};

interface SettingsScrollLayoutProps {
  sections: SettingsSection[];
  navTitle: string;
  navJumpTo: string;
  children: ReactNode;
}

export function SettingsScrollLayout({
  sections,
  navTitle,
  navJumpTo,
  children,
}: SettingsScrollLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(() => {
    if (typeof window === "undefined") {
      return sections[0]?.id ?? "";
    }
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash && sections.some((section) => section.id === currentHash)) {
      return currentHash;
    }
    return sections[0]?.id ?? "";
  });

  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );

  useEffect(() => {
    if (sectionIds.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibleEntries[0]) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0.15, 0.35, 0.55, 0.75],
      },
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  useEffect(() => {
    if (sectionIds.length === 0) {
      return;
    }

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace("#", "");
      if (currentHash && sectionIds.includes(currentHash)) {
        setActiveSection(currentHash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [sectionIds]);

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  return (
    <div className="grid gap-8 md:grid-cols-[240px_minmax(0,1fr)]">
      <div className="space-y-3">
        <div className="md:hidden">
          <details className="rounded-lg border border-base-200 bg-base-100/70 p-3">
            <summary className="cursor-pointer text-sm font-semibold">
              {navJumpTo}
            </summary>
            <ul className="menu menu-sm mt-2">
              {sections.map((section) => (
                <li
                  key={section.id}
                  className={activeSection === section.id ? "active" : ""}
                >
                  <a
                    href={`#${section.id}`}
                    className={`text-sm ${
                      activeSection === section.id
                        ? "font-semibold text-primary"
                        : ""
                    }`}
                    aria-current={
                      activeSection === section.id ? "location" : undefined
                    }
                    onClick={() => handleNavClick(section.id)}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>

        <nav
          className="hidden md:block md:sticky md:top-24"
          aria-label={navTitle}
        >
          <div className="rounded-lg border border-base-200 bg-base-100/70 p-3">
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60">
              {navTitle}
            </div>
            <ul className="menu menu-sm">
              {sections.map((section) => (
                <li
                  key={section.id}
                  className={activeSection === section.id ? "active" : ""}
                >
                  <a
                    href={`#${section.id}`}
                    className={`text-sm ${
                      activeSection === section.id
                        ? "font-semibold text-primary"
                        : ""
                    }`}
                    aria-current={
                      activeSection === section.id ? "location" : undefined
                    }
                    onClick={() => handleNavClick(section.id)}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className="space-y-8">{children}</div>
    </div>
  );
}
