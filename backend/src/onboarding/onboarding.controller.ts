import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { logTenantAction } from "../audit/audit.service";

export const onboardingRouter = Router();

// Onboarding runs even while LOCKED/GRACE isn't meaningful to gate on —
// a client mid-onboarding hasn't necessarily hit any billing state yet —
// but still requires an active-ish subscription so a truly locked account
// can't use this to sidestep the payment wall.
const ALLOWED = ["ACTIVE", "EXPIRING_SOON", "GRACE"];

onboardingRouter.get("/status", authenticate, scopeTenant(ALLOWED), async (req, res, next) => {
  try {
    const profile = await prisma.companyProfile.findUnique({ where: { clientId: req.clientId! } });
    const branches = await prisma.branch.findMany({ where: { clientId: req.clientId! } });
    return ok(res, {
      onboardingCompleted: req.client!.onboardingCompleted,
      companyProfile: profile,
      branches,
      multiBranchEntitled: !!(req.client as any).plan?.entitlements?.multi_branch,
    });
  } catch (err) {
    next(err);
  }
});

const companyProfileSchema = z.object({
  companyName: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  businessType: z.string().optional(),
  currency: z.string().optional(),
});

// Step 1 + 2 combined (Company Profile, Business Information) — the
// wizard can call this repeatedly as the user moves between steps since
// it's an upsert, not a one-shot create.
onboardingRouter.post("/company-profile", authenticate, scopeTenant(ALLOWED), async (req, res, next) => {
  try {
    const input = companyProfileSchema.parse(req.body);
    const profile = await prisma.companyProfile.upsert({
      where: { clientId: req.clientId! },
      update: input,
      create: { clientId: req.clientId!, ...input },
    });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "UPDATE_COMPANY_PROFILE" });
    return ok(res, profile, "Company profile saved");
  } catch (err) {
    next(err);
  }
});

const branchSchema = z.object({ name: z.string().min(1), address: z.string().optional() });

// Step 3 — only meaningful/shown when the plan includes multi_branch
// (Enterprise). Backend still enforces the entitlement rather than
// trusting the wizard to only call this when it should.
onboardingRouter.post("/branches", authenticate, scopeTenant(ALLOWED), async (req, res, next) => {
  try {
    const entitled = !!(req.client as any).plan?.entitlements?.multi_branch;
    if (!entitled) return fail(res, 403, "Multi-branch is not included in your plan", "FEATURE_NOT_ENTITLED");

    const input = branchSchema.parse(req.body);
    const branch = await prisma.branch.create({ data: { clientId: req.clientId!, ...input } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "CREATE_BRANCH", target: branch.id });
    return ok(res, branch, "Branch added");
  } catch (err) {
    next(err);
  }
});

// Step 4 — Finish. Marks onboarding complete so future logins skip
// straight to the dashboard.
onboardingRouter.post("/complete", authenticate, scopeTenant(ALLOWED), async (req, res, next) => {
  try {
    await prisma.client.update({ where: { id: req.clientId! }, data: { onboardingCompleted: true } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "COMPLETE_ONBOARDING" });
    return ok(res, {}, "Onboarding complete");
  } catch (err) {
    next(err);
  }
});
