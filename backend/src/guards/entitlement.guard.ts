import type { Request, Response, NextFunction } from "express";
import { fail } from "../common/response";

type EntitlementKey =
  | "enquiry_crm" | "bookings" | "quotation" | "drivers" | "vehicles"
  | "payments" | "basic_reports" | "advanced_reports" | "workflow_automation"
  | "enhanced_controls" | "multi_branch" | "integrations" | "custom_modules";

/**
 * Checks the resolved Client's plan entitlements JSON for the given
 * feature flag. Runs on the backend for every protected route — this is
 * the actual gate; hiding a sidebar link is UX only.
 */
export function requireEntitlement(feature: EntitlementKey) {
  return (req: Request, res: Response, next: NextFunction) => {
    const entitlements = (req.client as any)?.plan?.entitlements as Record<string, boolean> | undefined;

    if (!entitlements || entitlements[feature] !== true) {
      return fail(res, 403, "You do not have access to this feature", "FEATURE_NOT_ENTITLED");
    }

    return next();
  };
}

export function enforceUsageLimit(limit: number | null | undefined, currentUsage: number): boolean {
  if (limit === null || limit === undefined) return true;
  return currentUsage < limit;
}
