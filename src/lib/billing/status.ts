import type { PlanStatus } from "@/types/billing";

type PlanStatusNoticeKey =
  | "planStatusNotices.free.title"
  | "planStatusNotices.free.body"
  | "planStatusNotices.trialing.title"
  | "planStatusNotices.trialing.body"
  | "planStatusNotices.active.title"
  | "planStatusNotices.active.body"
  | "planStatusNotices.past_due.title"
  | "planStatusNotices.past_due.body"
  | "planStatusNotices.canceled.title"
  | "planStatusNotices.canceled.body"
  | "planStatusNotices.unpaid.title"
  | "planStatusNotices.unpaid.body"
  | "planStatusNotices.incomplete.title"
  | "planStatusNotices.incomplete.body"
  | "planStatusNotices.incomplete_expired.title"
  | "planStatusNotices.incomplete_expired.body"
  | "planStatusNotices.paused.title"
  | "planStatusNotices.paused.body"
  | "planStatusNotices.canceling.title"
  | "planStatusNotices.canceling.body";

export type PlanStatusNoticeTone = "info" | "warning" | "error" | "success";

export type PlanStatusNotice = {
  tone: PlanStatusNoticeTone;
  titleKey: PlanStatusNoticeKey;
  bodyKey: PlanStatusNoticeKey;
};

const planStatusNotices: Record<PlanStatus, PlanStatusNotice> = {
  free: {
    tone: "info",
    titleKey: "planStatusNotices.free.title",
    bodyKey: "planStatusNotices.free.body",
  },
  trialing: {
    tone: "success",
    titleKey: "planStatusNotices.trialing.title",
    bodyKey: "planStatusNotices.trialing.body",
  },
  active: {
    tone: "success",
    titleKey: "planStatusNotices.active.title",
    bodyKey: "planStatusNotices.active.body",
  },
  past_due: {
    tone: "warning",
    titleKey: "planStatusNotices.past_due.title",
    bodyKey: "planStatusNotices.past_due.body",
  },
  canceled: {
    tone: "info",
    titleKey: "planStatusNotices.canceled.title",
    bodyKey: "planStatusNotices.canceled.body",
  },
  unpaid: {
    tone: "error",
    titleKey: "planStatusNotices.unpaid.title",
    bodyKey: "planStatusNotices.unpaid.body",
  },
  incomplete: {
    tone: "warning",
    titleKey: "planStatusNotices.incomplete.title",
    bodyKey: "planStatusNotices.incomplete.body",
  },
  incomplete_expired: {
    tone: "error",
    titleKey: "planStatusNotices.incomplete_expired.title",
    bodyKey: "planStatusNotices.incomplete_expired.body",
  },
  paused: {
    tone: "warning",
    titleKey: "planStatusNotices.paused.title",
    bodyKey: "planStatusNotices.paused.body",
  },
};

export function getPlanStatusNotice(
  status: PlanStatus,
  options?: { cancelAtPeriodEnd?: boolean | null },
): PlanStatusNotice {
  if (
    options?.cancelAtPeriodEnd &&
    (status === "trialing" || status === "active")
  ) {
    return {
      tone: "warning",
      titleKey: "planStatusNotices.canceling.title",
      bodyKey: "planStatusNotices.canceling.body",
    };
  }

  return planStatusNotices[status];
}
