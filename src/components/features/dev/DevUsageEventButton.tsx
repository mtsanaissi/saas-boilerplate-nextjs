"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getErrorMessageKey } from "@/lib/errors";

interface DevUsageEventButtonProps {
  label: string;
}

export function DevUsageEventButton({ label }: DevUsageEventButtonProps) {
  const router = useRouter();
  const tErrors = useTranslations("errors");
  const tDev = useTranslations("dev.usage");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    try {
      const response = await fetch("/api/usage/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "dev_seed", amount: 5 }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "unknown");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown");
    }
  }

  const errorKey = error ? getErrorMessageKey(error) : null;
  const errorMessage = errorKey ? tErrors(errorKey) : null;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="btn btn-outline btn-xs"
        disabled={isPending}
      >
        {label}
      </button>
      {errorMessage ? (
        <span className="text-xs text-error">
          {tDev("errorPrefix", { message: errorMessage })}
        </span>
      ) : null}
    </div>
  );
}
