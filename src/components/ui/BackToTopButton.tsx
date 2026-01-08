import type { ReactNode } from "react";

interface BackToTopButtonProps {
  href: string;
  label: string;
  icon?: ReactNode;
  className?: string;
}

export function BackToTopButton({
  href,
  label,
  icon,
  className,
}: BackToTopButtonProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className={`btn btn-circle btn-primary fixed bottom-5 right-5 z-30 shadow-lg ${className ?? ""}`}
    >
      {icon ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M12 4l-7 7 1.41 1.41L11 7.83V20h2V7.83l4.59 4.58L19 11z" />
        </svg>
      )}
    </a>
  );
}
