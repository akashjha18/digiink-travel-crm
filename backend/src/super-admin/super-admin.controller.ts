import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { provisionNewClient } from "../provisioning/provisioning.service";
import { logSuperAdminAction } from "../audit/audit.service";

export const superAdminRouter = Router();

// --- Dashboard summary -----------------------------------------------------
superAdminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const [total, active, expiringSoon, grace, locked, deleted, pendingPayments] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { subscriptionStatus: "ACTIVE" } }),
      prisma.client.count({ where: { subscriptionStatus: "EXPIRING_SOON" } }),
      prisma.client.count({ where: { subscriptionStatus: "GRACE" } }),
      prisma.client.count({ where: { subscriptionStatus: "LOCKED" } }),
      prisma.client.count({ where: { subscriptionStatus: "DELETED" } }),
      prisma.paymentNotice.count({ where: { status: "PENDING" } }),
    ]);

    return ok(res, { total, active, expiringSoon, grace, locked, deleted, pendingPayments });
  } catch (err) {
    next(err);
  }
});

// --- Clients ----------------------------------------------------------------
superAdminRouter.get("/clients", async (_req, res, next) => {
  try {
    const clients = await prisma.client.findMany({ include: { plan: true }, orderBy: { createdAt: "desc" } });
    return ok(res, clients);
  } catch (err) {
    next(err);
  }
});

superAdminRouter.get("/clients/:id", async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { plan: true, paymentLogs: { orderBy: { date: "desc" } }, paymentNotices: { orderBy: { createdAt: "desc" } } },
    });
    if (!client) return fail(res, 404, "Client not found", "NOT_FOUND");
    return ok(res, client);
  } catch (err) {
    next(err);
  }
});

const createClientSchema = z.object({
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  planId: z.string(),
  subscriptionStart: z.coerce.date(),
  subscriptionExpiry: z.coerce.date(),
});

superAdminRouter.post("/clients", async (req, res, next) => {
  try {
    const input = createClientSchema.parse(req.body);
    const { client, temporaryPassword } = await provisionNewClient({
      ...input,
      actorId: req.auth!.sub,
      actorEmail: "super-admin",
    });

    // TODO(email): send welcome email via EmailService with client.clientCode,
    // temporaryPassword, and the login URL once real SMTP/SES is wired up.

    return ok(res, { client, temporaryPassword }, "Client created");
  } catch (err) {
    next(err);
  }
});

superAdminRouter.post("/clients/:id/activate", async (req, res, next) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { subscriptionStatus: "ACTIVE", lockedAt: null },
    });
    await logSuperAdminAction({ actorId: req.auth!.sub, actorEmail: "super-admin", action: "ACTIVATE_CLIENT", targetClientId: client.id });
    return ok(res, client);
  } catch (err) {
    next(err);
  }
});

superAdminRouter.post("/clients/:id/deactivate", async (req, res, next) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { subscriptionStatus: "LOCKED", lockedAt: new Date() },
    });
    await logSuperAdminAction({ actorId: req.auth!.sub, actorEmail: "super-admin", action: "DEACTIVATE_CLIENT", targetClientId: client.id });
    return ok(res, client);
  } catch (err) {
    next(err);
  }
});

superAdminRouter.post("/clients/:id/extend-grace", async (req, res, next) => {
  try {
    const { days } = z.object({ days: z.number().int().positive() }).parse(req.body);
    const client = await prisma.client.findUniqueOrThrow({ where: { id: req.params.id } });
    const base = client.graceEndsAt ?? new Date();
    const newGraceEndsAt = new Date(base);
    newGraceEndsAt.setDate(newGraceEndsAt.getDate() + days);

    const updated = await prisma.client.update({
      where: { id: req.params.id },
      data: { graceEndsAt: newGraceEndsAt, subscriptionStatus: "GRACE", lockedAt: null },
    });
    await logSuperAdminAction({ actorId: req.auth!.sub, actorEmail: "super-admin", action: "EXTEND_GRACE", targetClientId: client.id, metadata: { days } });
    return ok(res, updated, "Grace period extended");
  } catch (err) {
    next(err);
  }
});

// Deletion in the single-database model means soft-deleting the client's
// rows (mark DELETED + wipe nothing yet) rather than dropping a database —
// there is no separate database to drop anymore. A real hard-delete of a
// client's rows across every tenant-scoped table is a deliberately separate,
// heavily-audited operation left for a later phase rather than bundled
// silently into this endpoint.
superAdminRouter.post("/clients/:id/delete", async (req, res, next) => {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { subscriptionStatus: "DELETED", deletedAt: new Date() },
    });
    await logSuperAdminAction({ actorId: req.auth!.sub, actorEmail: "super-admin", action: "DELETE_CLIENT", targetClientId: client.id });
    return ok(res, client, "Client marked as deleted (data retained — see note in code before enabling hard-delete)");
  } catch (err) {
    next(err);
  }
});

const confirmPaymentSchema = z.object({
  amountInPaise: z.number().int().positive(),
  date: z.coerce.date(),
  mode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"]),
  reference: z.string().optional(),
  note: z.string().optional(),
  newSubscriptionExpiry: z.coerce.date(),
});

superAdminRouter.post("/clients/:id/confirm-payment", async (req, res, next) => {
  try {
    const input = confirmPaymentSchema.parse(req.body);
    const clientId = req.params.id;

    const [paymentLog, client] = await prisma.$transaction([
      prisma.paymentLog.create({ data: { clientId, ...input, confirmedBy: req.auth!.sub } }),
      prisma.client.update({
        where: { id: clientId },
        data: { subscriptionStatus: "ACTIVE", subscriptionExpiry: input.newSubscriptionExpiry, graceEndsAt: null, lockedAt: null },
      }),
    ]);

    await prisma.paymentNotice.updateMany({
      where: { clientId, status: "PENDING" },
      data: { status: "CONFIRMED", reviewedAt: new Date(), reviewedBy: req.auth!.sub },
    });

    await logSuperAdminAction({
      actorId: req.auth!.sub, actorEmail: "super-admin", action: "CONFIRM_PAYMENT",
      targetClientId: clientId, metadata: { amountInPaise: input.amountInPaise, mode: input.mode },
    });

    return ok(res, { paymentLog, client }, "Payment confirmed, access restored");
  } catch (err) {
    next(err);
  }
});

// --- Payment notices ----------------------------------------------------------
superAdminRouter.get("/payment-notices", async (req, res, next) => {
  try {
    const status = (req.query.status as string) ?? "PENDING";
    const notices = await prisma.paymentNotice.findMany({
      where: { status },
      include: { client: { select: { businessName: true, email: true, clientCode: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, notices);
  } catch (err) {
    next(err);
  }
});

superAdminRouter.post("/payment-notices/:id/dismiss", async (req, res, next) => {
  try {
    const notice = await prisma.paymentNotice.update({
      where: { id: req.params.id },
      data: { status: "DISMISSED", reviewedAt: new Date(), reviewedBy: req.auth!.sub },
    });
    return ok(res, notice);
  } catch (err) {
    next(err);
  }
});

// --- Usage statistics -----------------------------------------------------------
superAdminRouter.get("/clients/:id/usage", async (req, res, next) => {
  try {
    const clientId = req.params.id;
    const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [userCount, enquiriesThisMonth, plan] = await Promise.all([
      prisma.user.count({ where: { clientId, isActive: true } }),
      prisma.enquiry.count({ where: { clientId, createdAt: { gte: startOfMonth } } }),
      prisma.plan.findUnique({ where: { id: client.planId } }),
    ]);

    return ok(res, {
      users: { used: userCount, limit: plan?.maxUsers ?? null },
      enquiriesThisMonth: { used: enquiriesThisMonth, limit: plan?.maxEnquiriesPerMonth ?? null },
    });
  } catch (err) {
    next(err);
  }
});

// --- Staff (per client, Super Admin support view) --------------------------
superAdminRouter.get("/clients/:id/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { clientId: req.params.id },
      include: { role: true },
      orderBy: { createdAt: "asc" },
    });
    return ok(res, users.map(({ passwordHash, ...safe }) => safe));
  } catch (err) {
    next(err);
  }
});

superAdminRouter.post("/clients/:id/users/:userId/force-password-reset", async (req, res, next) => {
  try {
    const { generateTemporaryPassword, hashPassword } = await import("../auth/password");
    const tempPassword = generateTemporaryPassword();
    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true },
    });
    await logSuperAdminAction({
      actorId: req.auth!.sub, actorEmail: "super-admin", action: "FORCE_PASSWORD_RESET",
      targetClientId: req.params.id, metadata: { userId: user.id },
    });
    return ok(res, { temporaryPassword: tempPassword }, "Password reset — share the temporary password with the user");
  } catch (err) {
    next(err);
  }
});

// --- Plan manager -------------------------------------------------------------
superAdminRouter.get("/plans", async (_req, res, next) => {
  try {
    return ok(res, await prisma.plan.findMany());
  } catch (err) {
    next(err);
  }
});

const upsertPlanSchema = z.object({
  name: z.string(),
  priceInPaise: z.number().int().nonnegative(),
  entitlements: z.record(z.boolean()),
  maxUsers: z.number().int().nullable().optional(),
  maxEnquiriesPerMonth: z.number().int().nullable().optional(),
  maxBranches: z.number().int().nullable().optional(),
});

superAdminRouter.post("/plans", async (req, res, next) => {
  try {
    const input = upsertPlanSchema.parse(req.body);
    const plan = await prisma.plan.create({ data: input });
    await logSuperAdminAction({ actorId: req.auth!.sub, actorEmail: "super-admin", action: "CREATE_PLAN", metadata: { planId: plan.id } });
    return ok(res, plan, "Plan created");
  } catch (err) {
    next(err);
  }
});

superAdminRouter.patch("/plans/:id", async (req, res, next) => {
  try {
    const input = upsertPlanSchema.partial().parse(req.body);
    const plan = await prisma.plan.update({ where: { id: req.params.id }, data: input });
    await logSuperAdminAction({ actorId: req.auth!.sub, actorEmail: "super-admin", action: "CHANGE_PLAN", metadata: { planId: plan.id } });
    return ok(res, plan, "Plan updated — takes effect on clients' next request, no redeploy needed");
  } catch (err) {
    next(err);
  }
});

// --- Audit log ----------------------------------------------------------------
superAdminRouter.get("/audit-logs", async (_req, res, next) => {
  try {
    const logs = await prisma.superAdminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return ok(res, logs);
  } catch (err) {
    next(err);
  }
});
