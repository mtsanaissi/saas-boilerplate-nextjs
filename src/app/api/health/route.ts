import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateServerEnv } from "@/lib/env/server";
import { getRequestId } from "@/lib/observability/request-id";
import { logError, logInfo } from "@/lib/observability/logger";

type HealthDependencyStatus = "ok" | "error" | "skipped";

type HealthDependency = {
  status: HealthDependencyStatus;
  details?: string;
  latencyMs?: number;
};

type HealthResponse = {
  status: "ok" | "degraded";
  timestamp: string;
  uptime: number;
  requestId: string;
  dependencies: {
    env: HealthDependency;
    supabase: HealthDependency;
  };
};

function summarizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export async function GET(_request: NextRequest) {
  const requestId = await getRequestId();

  let envStatus: HealthDependency = { status: "ok" };
  try {
    validateServerEnv();
  } catch (error) {
    envStatus = { status: "error", details: summarizeError(error) };
    logError("health_check_env_failed", {
      requestId,
      details: envStatus.details,
    });
  }

  let supabaseStatus: HealthDependency = { status: "skipped" };

  if (envStatus.status === "ok") {
    const start = Date.now();
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);

      const latencyMs = Date.now() - start;

      if (error) {
        supabaseStatus = {
          status: "error",
          details: error.message,
          latencyMs,
        };
        logError("health_check_supabase_failed", {
          requestId,
          details: error.message,
          latencyMs,
        });
      } else {
        supabaseStatus = { status: "ok", latencyMs };
      }
    } catch (error) {
      const latencyMs = Date.now() - start;
      supabaseStatus = {
        status: "error",
        details: summarizeError(error),
        latencyMs,
      };
      logError("health_check_supabase_exception", {
        requestId,
        details: supabaseStatus.details,
        latencyMs,
      });
    }
  }

  const status =
    envStatus.status === "ok" && supabaseStatus.status === "ok"
      ? "ok"
      : "degraded";

  const payload: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    requestId,
    dependencies: {
      env: envStatus,
      supabase: supabaseStatus,
    },
  };

  if (status === "ok") {
    logInfo("health_check_ok", { requestId });
  }

  return NextResponse.json(payload, {
    status: status === "ok" ? 200 : 503,
    headers: { "x-request-id": requestId },
  });
}
