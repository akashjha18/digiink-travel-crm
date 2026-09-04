import { env } from "../config/env";
import type { SubscriptionStatus } from "../generated/control-client";

/**
 * Pure function that derives the "effective" subscription status from
 * dates, independent of whatever is currently persisted. The cron job in
 * jobs/subscription-lifecycle.job.ts calls this to decide when to transition
 * a client between states; API guards call it to double-check on every
 * request so a stale cached status never grants access it shouldn't.
 */
export function computeEffectiveStatus(params: {
  subscriptionExpiry: Date;
  now?: Date;
}): { status: SubscriptionStatus; graceEndsAt: Date; deleteAt: Date } {
  const now = params.now ?? new Date();
  const expiry = params.subscriptionExpiry;

  const graceEndsAt = addDays(expiry, env.subscription.graceDays);
  const deleteAt = addDays(expiry, env.subscription.deleteAfterDays);
  const expiringSoonFrom = addDays(expiry, -env.subscription.expiringSoonDays);

  let status: SubscriptionStatus;
  if (now < expiringSoonFrom) {
    status = "ACTIVE";
  } else if (now < expiry) {
    status = "EXPIRING_SOON";
  } else if (now < graceEndsAt) {
    status = "GRACE";
  } else if (now < deleteAt) {
    status = "LOCKED";
  } else {
    status = "LOCKED"; // actual deletion is a deliberate, audited job action, not implied by date alone
  }

  return { status, graceEndsAt, deleteAt };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
