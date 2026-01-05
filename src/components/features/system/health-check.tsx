"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

export function HealthCheck() {
  const t = useTranslations("system.healthCheck");
  const [status, setStatus] = useState<"loading" | "connected" | "error">(
    "loading",
  );
  const [envCheck, setEnvCheck] = useState<string>(t("envChecking"));

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabase = createClient();
        setEnvCheck(t("envChecking"));

        // 1. Check if ENV vars are loaded
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          throw new Error(t("missingEnvVars"));
        }
        setEnvCheck(t("envLoaded"));

        // 2. Simple ping to Auth service
        const { error } = await supabase.auth.getSession();

        if (error) throw error;
        setStatus("connected");
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    }

    checkConnection();
  }, [t]);

  return (
    <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl border border-base-300">
      <div className="card-body">
        <h3 className="card-title text-sm opacity-70">{t("title")}</h3>

        {/* Tailwind v4 + DaisyUI v5 Badge */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-mono">{t("serviceName")}</span>
          {status === "loading" && (
            <span className="badge badge-warning animate-pulse">
              {t("statusChecking")}
            </span>
          )}
          {status === "connected" && (
            <span className="badge badge-success gap-2">
              {t("statusOnline")}
            </span>
          )}
          {status === "error" && (
            <span className="badge badge-error gap-2">
              {t("statusOffline")}
            </span>
          )}
        </div>

        <div className="text-xs text-base-content/50 mt-2 font-mono">
          {envCheck}
        </div>
      </div>
    </div>
  );
}
