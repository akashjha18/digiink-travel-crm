import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { logTenantAction } from "../audit/audit.service";

export const dutySlipsRouter = Router({ mergeParams: true });

dutySlipsRouter.use(authenticate, scopeTenant());

// Helper to generate unique slip number like DS-2026-0001
async function generateSlipNumber(clientId: string): Promise<string> {
  const currentYear = new Date().getFullYear();
  const count = await prisma.dutySlip.count({ where: { clientId } });
  const padded = String(count + 1).padStart(4, "0");
  return `DS-${currentYear}-${padded}`;
}

// -------------------------------------------------------------
// GET /api/trips/:tripId/duty-slip
// Fetch duty slip for a trip
// -------------------------------------------------------------
dutySlipsRouter.get("/:tripId/duty-slip", async (req, res, next) => {
  try {
    const clientId = req.clientId!;
    const { tripId } = req.params;

    const dutySlip = await prisma.dutySlip.findFirst({
      where: { tripId, clientId },
      include: {
        expenses: { orderBy: { createdAt: "asc" } },
        trip: {
          include: {
            driver: true,
            vehicle: true,
            booking: {
              include: { customer: true },
            },
          },
        },
      },
    });

    if (!dutySlip) {
      return fail(res, 404, "Duty slip not generated yet for this trip", "NOT_FOUND");
    }

    return ok(res, dutySlip);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// POST /api/trips/:tripId/duty-slip
// Generate or re-sync Duty Slip from Trip details
// -------------------------------------------------------------
dutySlipsRouter.post("/:tripId/duty-slip", async (req, res, next) => {
  try {
    const clientId = req.clientId!;
    const { tripId } = req.params;

    const trip = await prisma.trip.findFirst({
      where: { id: tripId, clientId },
      include: {
        driver: true,
        vehicle: true,
        booking: {
          include: { customer: true },
        },
        dutySlip: true,
      },
    });

    if (!trip) return fail(res, 404, "Trip not found", "NOT_FOUND");

    if (trip.dutySlip) {
      // If already exists, return existing duty slip
      return ok(res, trip.dutySlip, "Duty slip already exists");
    }

    const slipNumber = await generateSlipNumber(clientId);
    const shareToken = crypto.randomBytes(24).toString("hex");

    const dutySlip = await prisma.dutySlip.create({
      data: {
        clientId,
        tripId,
        slipNumber,
        shareToken,
        passengerName: trip.booking?.customer?.name || "Valued Passenger",
        passengerPhone: trip.booking?.customer?.phone || null,
        pickupAddress: trip.pickup || "Pickup Location",
        dropAddress: trip.drop || "Drop Location",
        reportingTime: trip.startDate || new Date(),
        driverName: trip.driver?.name || null,
        driverPhone: trip.driver?.contact || null,
        vehicleNumber: trip.vehicle?.registrationNumber || null,
        vehicleModel: trip.vehicle ? `${trip.vehicle.vehicleName || ""} (${trip.vehicle.vehicleType})`.trim() : null,
        status: "GENERATED",
        notes: trip.itineraryNotes || null,
      },
      include: {
        expenses: true,
        trip: true,
      },
    });

    await logTenantAction({
      clientId,
      userId: req.auth!.sub,
      action: "GENERATE_DUTY_SLIP",
      target: dutySlip.id,
      metadata: { slipNumber, tripId },
    });

    return ok(res, dutySlip, "Duty slip generated successfully", 201);
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// POST /api/trips/:tripId/duty-slip/dispatch
// Mark as dispatched to driver
// -------------------------------------------------------------
dutySlipsRouter.post("/:tripId/duty-slip/dispatch", async (req, res, next) => {
  try {
    const clientId = req.clientId!;
    const { tripId } = req.params;

    const existing = await prisma.dutySlip.findFirst({
      where: { tripId, clientId },
    });
    if (!existing) return fail(res, 404, "Duty slip not found", "NOT_FOUND");

    const updated = await prisma.dutySlip.update({
      where: { id: existing.id },
      data: {
        status: existing.status === "GENERATED" ? "DISPATCHED" : existing.status,
        dispatchedAt: new Date(),
      },
    });

    await logTenantAction({
      clientId,
      userId: req.auth!.sub,
      action: "DISPATCH_DUTY_SLIP",
      target: updated.id,
      metadata: { slipNumber: updated.slipNumber },
    });

    return ok(res, updated, "Duty slip marked as dispatched");
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// PATCH /api/trips/:tripId/duty-slip
// Update Duty Slip from Dispatcher Desk
// -------------------------------------------------------------
const updateDutySlipSchema = z.object({
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  vehicleNumber: z.string().optional(),
  vehicleModel: z.string().optional(),
  pickupAddress: z.string().optional(),
  dropAddress: z.string().optional(),
  reportingTime: z.coerce.date().optional(),
  startOdometer: z.number().int().nonnegative().optional(),
  endOdometer: z.number().int().nonnegative().optional(),
  tollChargesInPaise: z.number().int().nonnegative().optional(),
  parkingChargesInPaise: z.number().int().nonnegative().optional(),
  stateTaxInPaise: z.number().int().nonnegative().optional(),
  fuelChargesInPaise: z.number().int().nonnegative().optional(),
  driverAllowanceInPaise: z.number().int().nonnegative().optional(),
  otherChargesInPaise: z.number().int().nonnegative().optional(),
  status: z.enum(["GENERATED", "DISPATCHED", "STARTED", "COMPLETED", "BILLED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

dutySlipsRouter.patch("/:tripId/duty-slip", async (req, res, next) => {
  try {
    const clientId = req.clientId!;
    const { tripId } = req.params;

    const existing = await prisma.dutySlip.findFirst({
      where: { tripId, clientId },
    });
    if (!existing) return fail(res, 404, "Duty slip not found", "NOT_FOUND");

    const input = updateDutySlipSchema.parse(req.body);

    const startOdometer = input.startOdometer !== undefined ? input.startOdometer : existing.startOdometer;
    const endOdometer = input.endOdometer !== undefined ? input.endOdometer : existing.endOdometer;
    const totalKm =
      startOdometer !== null && endOdometer !== null && endOdometer >= startOdometer
        ? endOdometer - startOdometer
        : existing.totalKm;

    const tollCharges = input.tollChargesInPaise ?? existing.tollChargesInPaise;
    const parkingCharges = input.parkingChargesInPaise ?? existing.parkingChargesInPaise;
    const stateTax = input.stateTaxInPaise ?? existing.stateTaxInPaise;
    const fuelCharges = input.fuelChargesInPaise ?? existing.fuelChargesInPaise;
    const driverAllowance = input.driverAllowanceInPaise ?? existing.driverAllowanceInPaise;
    const otherCharges = input.otherChargesInPaise ?? existing.otherChargesInPaise;
    const totalExpensesInPaise =
      tollCharges + parkingCharges + stateTax + fuelCharges + driverAllowance + otherCharges;

    const updated = await prisma.dutySlip.update({
      where: { id: existing.id },
      data: {
        ...input,
        startOdometer,
        endOdometer,
        totalKm,
        totalExpensesInPaise,
      },
      include: {
        expenses: true,
      },
    });

    return ok(res, updated, "Duty slip updated");
  } catch (err) {
    next(err);
  }
});
