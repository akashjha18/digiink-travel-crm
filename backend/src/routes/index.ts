import { Router } from "express";
import { authRouter } from "../auth/auth.controller";
import { authenticate, requireSuperAdmin } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { requireEntitlement } from "../guards/entitlement.guard";
import { ok } from "../common/response";
import { superAdminRouter } from "../super-admin/super-admin.controller";
import { onboardingRouter } from "../onboarding/onboarding.controller";
import { customersRouter } from "../customers/customers.controller";
import { enquiriesRouter } from "../enquiries/enquiries.controller";
import { usersRouter } from "../users/users.controller";
import { rolesRouter } from "../roles/roles.controller";
import { quotationsRouter } from "../quotations/quotations.controller";
import { bookingsRouter } from "../bookings/bookings.controller";
import { driversRouter } from "../drivers/drivers.controller";
import { vehiclesRouter } from "../vehicles/vehicles.controller";
import { tripsRouter } from "../trips/trips.controller";
import { paymentsRouter } from "../payments/payments.controller";
import { invoicesRouter } from "../invoices/invoices.controller";
import { receivablesRouter } from "../receivables/receivables.controller";
import { reportsRouter } from "../reports/reports.controller";
import { automationRouter } from "../automation/automation.controller";
import { branchesRouter } from "../branches/branches.controller";
import { whatsappRouter, whatsappWebhookRouter } from "../whatsapp/whatsapp.controller";
import { customFieldsRouter } from "../custom-fields/custom-fields.controller";
import { prisma } from "../db/prisma";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);

apiRouter.use("/super-admin", authenticate, requireSuperAdmin, superAdminRouter);

apiRouter.use("/onboarding", onboardingRouter);
apiRouter.use("/customers", customersRouter);
apiRouter.use("/enquiries", enquiriesRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/roles", rolesRouter);
apiRouter.use("/quotations", quotationsRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/drivers", driversRouter);
apiRouter.use("/vehicles", vehiclesRouter);
apiRouter.use("/trips", tripsRouter);
apiRouter.use("/payments", paymentsRouter);
apiRouter.use("/invoices", invoicesRouter);
apiRouter.use("/receivables", receivablesRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/automation", automationRouter);
apiRouter.use("/branches", branchesRouter);
// Public — no authenticate/scopeTenant. Meta's webhook servers call this
// directly with no login session; verification happens per-client via
// each client's own webhookVerifyToken inside the router itself.
// Deliberately mounted at a path that does NOT share a prefix with
// "/whatsapp" — whatsappRouter applies authenticate/scopeTenant via its
// own router-level .use(), which would otherwise run for ANY request
// under "/whatsapp/*" (including this one) before Express ever reaches
// this separate router, silently 401-ing Meta's callbacks.
apiRouter.use("/whatsapp-webhook", whatsappWebhookRouter);
apiRouter.use("/whatsapp", whatsappRouter);
apiRouter.use("/custom-fields", customFieldsRouter);

apiRouter.get("/client/profile", authenticate, scopeTenant(), (req, res) => {
  return ok(res, req.client);
});

// Dashboard metrics (SRS section 40). Starter tier only for now — the
// Professional+/Business+ tiers add booking revenue, outstanding
// payments, and advanced analytics, which land in Phases 5/7/8 once
// Booking/Payment data actually exists to aggregate.
apiRouter.get("/client/dashboard", authenticate, scopeTenant(), requireEntitlement("enquiry_crm"), async (req, res, next) => {
  try {
    const clientId = req.clientId!;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalEnquiries, newEnquiries, recentActivities] = await Promise.all([
      prisma.enquiry.count({ where: { clientId } }),
      prisma.enquiry.count({ where: { clientId, createdAt: { gte: startOfMonth } } }),
      prisma.followUp.findMany({
        where: { clientId },
        include: { loggedBy: { select: { name: true } }, enquiry: { select: { id: true, destination: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const metrics: Record<string, unknown> = { totalEnquiries, newEnquiries, recentActivities };

    // Professional+ adds booking/revenue/outstanding metrics now that
    // Bookings and Payments exist (SRS section 40).
    const entitlements = (req.client as any)?.plan?.entitlements ?? {};
    if (entitlements.bookings) {
      const [activeBookings, revenueAgg] = await Promise.all([
        prisma.booking.count({ where: { clientId, status: { in: ["CONFIRMED", "IN_PROGRESS"] } } }),
        prisma.booking.aggregate({ where: { clientId }, _sum: { amountInPaise: true } }),
      ]);
      metrics.activeBookings = activeBookings;
      metrics.totalBookingRevenueInPaise = revenueAgg._sum.amountInPaise ?? 0;
    }
    if (entitlements.payments) {
      const bookings = await prisma.booking.findMany({
        where: { clientId, status: { not: "CANCELLED" } },
        select: { amountInPaise: true, payments: { select: { amountInPaise: true } } },
      });
      const outstandingInPaise = bookings.reduce((sum, b) => {
        const paid = b.payments.reduce((s, p) => s + p.amountInPaise, 0);
        return sum + Math.max(b.amountInPaise - paid, 0);
      }, 0);
      metrics.outstandingPaymentsInPaise = outstandingInPaise;
    }

    return ok(res, metrics);
  } catch (err) {
    next(err);
  }
});

apiRouter.get("/payment-renewal", authenticate, async (req, res, next) => {
  try {
    if (req.auth?.role !== "CLIENT_USER" || !req.auth.clientId) {
      return ok(res, null);
    }
    const client = await prisma.client.findUnique({ where: { id: req.auth.clientId } });
    return ok(res, {
      subscriptionStatus: client?.subscriptionStatus,
      subscriptionExpiry: client?.subscriptionExpiry,
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post("/payment-renewal/notify", authenticate, async (req, res, next) => {
  try {
    if (req.auth?.role !== "CLIENT_USER" || !req.auth.clientId) {
      return ok(res, null);
    }
    const notice = await prisma.paymentNotice.create({
      data: { clientId: req.auth.clientId, message: req.body?.message },
    });
    return ok(res, notice, "Payment notice sent to Super Admin");
  } catch (err) {
    next(err);
  }
});
