"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface DevUsageEventButtonProps {
  label: string;
}

export function DevUsageEventButton({ label }: DevUsageEventButtonProps) {
  const router = useRouter();
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
        throw new Error(payload.error ?? "request_failed");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "request_failed");
    }
  }

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
      {error ? (
        <span className="text-xs text-error">Error: {error}</span>
      ) : null}
    </div>
  );
}
