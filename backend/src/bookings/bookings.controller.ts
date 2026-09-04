import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { requireEntitlement } from "../guards/entitlement.guard";
import { requirePermission } from "../guards/rbac.guard";
import { logTenantAction } from "../audit/audit.service";

export const bookingsRouter = Router();

bookingsRouter.use(authenticate, scopeTenant(), requireEntitlement("bookings"));

bookingsRouter.get("/", requirePermission("bookings", "view"), async (req, res, next) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    const bookings = await prisma.booking.findMany({
      where: { clientId: req.clientId!, ...(status ? { status: status as any } : {}) },
      include: {
        customer: true,
        quotation: { select: { id: true, version: true } },
        driver: { select: { id: true, name: true } },
        vehicle: { select: { id: true, registrationNumber: true } },
        trip: true,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return ok(res, bookings);
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get("/:id", requirePermission("bookings", "view"), async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, clientId: req.clientId! },
      include: {
        customer: true,
        quotation: true,
        driver: true,
        vehicle: true,
        trip: true,
        payments: { orderBy: { paymentDate: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!booking) return fail(res, 404, "Booking not found", "NOT_FOUND");
    return ok(res, booking);
  } catch (err) {
    next(err);
  }
});

const updateStatusSchema = z.object({ status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]) });

bookingsRouter.patch("/:id/status", requirePermission("bookings", "edit"), async (req, res, next) => {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const existing = await prisma.booking.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Booking not found", "NOT_FOUND");

    const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "UPDATE_BOOKING_STATUS", target: booking.id, metadata: { from: existing.status, to: status } });
    return ok(res, booking, "Booking status updated");
  } catch (err) {
    next(err);
  }
});

const updateTravelDatesSchema = z.object({
  travelStart: z.coerce.date().optional(),
  travelEnd: z.coerce.date().optional(),
  paymentDueDate: z.coerce.date().optional(),
});

bookingsRouter.patch("/:id", requirePermission("bookings", "edit"), async (req, res, next) => {
  try {
    const input = updateTravelDatesSchema.parse(req.body);
    const existing = await prisma.booking.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Booking not found", "NOT_FOUND");

    const booking = await prisma.booking.update({ where: { id: req.params.id }, data: input });

    // Keep the auto-created Trip's dates in step with the booking's.
    if (input.travelStart || input.travelEnd) {
      await prisma.trip.updateMany({
        where: { bookingId: booking.id },
        data: { startDate: input.travelStart, endDate: input.travelEnd },
      });
    }

    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "UPDATE_BOOKING", target: booking.id });
    return ok(res, booking, "Booking updated");
  } catch (err) {
    next(err);
  }
});
