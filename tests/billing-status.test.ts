import { describe, expect, it } from "vitest";
import type { PlanStatus } from "@/types/billing";
import { getPlanStatusNotice } from "@/lib/billing/status";

describe("getPlanStatusNotice", () => {
  it("returns a notice for every plan status", () => {
    const statuses: PlanStatus[] = [
      "free",
      "trialing",
      "active",
      "past_due",
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ];

    statuses.forEach((status) => {
      const notice = getPlanStatusNotice(status);
      expect(notice).toEqual(
        expect.objectContaining({
          titleKey: expect.any(String),
          bodyKey: expect.any(String),
        }),
      );
    });
  });

  it("returns cancellation notice when cancel at period end is set", () => {
    const notice = getPlanStatusNotice("active", {
      cancelAtPeriodEnd: true,
    });

    expect(notice.titleKey).toBe("planStatusNotices.canceling.title");
  });
});
