import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { requireEntitlement } from "../guards/entitlement.guard";
import { requirePermission } from "../guards/rbac.guard";
import { logTenantAction } from "../audit/audit.service";

export const vehiclesRouter = Router();

// Vehicle Records & Allocation is Professional+ (SRS section 6/FR-7).
vehiclesRouter.use(authenticate, scopeTenant(), requireEntitlement("vehicles"));

vehiclesRouter.get("/", requirePermission("vehicles", "view"), async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { clientId: req.clientId! },
      include: { assignedDriver: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, vehicles);
  } catch (err) {
    next(err);
  }
});

// Vehicles with any document expiring within 30 days — used by the
// expiry alert list (SRS FR-7.1). Registered before "/:id" so "alerts"
// isn't swallowed as a vehicle id.
vehiclesRouter.get("/alerts/expiring", requirePermission("vehicles", "view"), async (req, res, next) => {
  try {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const vehicles = await prisma.vehicle.findMany({
      where: {
        clientId: req.clientId!,
        OR: [
          { rcExpiry: { lte: in30Days } },
          { insuranceExpiry: { lte: in30Days } },
          { permitExpiry: { lte: in30Days } },
        ],
      },
    });
    return ok(res, vehicles);
  } catch (err) {
    next(err);
  }
});

vehiclesRouter.get("/:id", requirePermission("vehicles", "view"), async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, clientId: req.clientId! },
      include: {
        assignedDriver: true,
        documents: true,
        trips: { orderBy: { startDate: "desc" }, take: 20, include: { booking: { select: { id: true } } } },
      },
    });
    if (!vehicle) return fail(res, 404, "Vehicle not found", "NOT_FOUND");
    return ok(res, vehicle);
  } catch (err) {
    next(err);
  }
});

const vehicleSchema = z.object({
  vehicleType: z.string().min(1),
  registrationNumber: z.string().min(1),
  capacity: z.number().int().positive(),
  rcExpiry: z.coerce.date().optional(),
  insuranceExpiry: z.coerce.date().optional(),
  permitExpiry: z.coerce.date().optional(),
  assignedDriverId: z.string().optional(),
});

vehiclesRouter.post("/", requirePermission("vehicles", "add"), async (req, res, next) => {
  try {
    const input = vehicleSchema.parse(req.body);

    const duplicate = await prisma.vehicle.findFirst({ where: { clientId: req.clientId!, registrationNumber: input.registrationNumber } });
    if (duplicate) return fail(res, 400, "A vehicle with this registration number already exists", "DUPLICATE_REGISTRATION");

    const vehicle = await prisma.vehicle.create({ data: { clientId: req.clientId!, ...input } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "CREATE_VEHICLE", target: vehicle.id });
    return ok(res, vehicle, "Vehicle added");
  } catch (err) {
    next(err);
  }
});

vehiclesRouter.patch("/:id", requirePermission("vehicles", "edit"), async (req, res, next) => {
  try {
    const input = vehicleSchema.partial().extend({ isAvailable: z.boolean().optional() }).parse(req.body);
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Vehicle not found", "NOT_FOUND");

    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: input });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "UPDATE_VEHICLE", target: vehicle.id });
    return ok(res, vehicle, "Vehicle updated");
  } catch (err) {
    next(err);
  }
});

vehiclesRouter.delete("/:id", requirePermission("vehicles", "delete"), async (req, res, next) => {
  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Vehicle not found", "NOT_FOUND");

    const activeTrip = await prisma.trip.findFirst({ where: { vehicleId: req.params.id, status: { in: ["SCHEDULED", "IN_PROGRESS"] } } });
    if (activeTrip) return fail(res, 400, "This vehicle has an active or upcoming trip and cannot be removed", "VEHICLE_HAS_ACTIVE_TRIP");

    await prisma.vehicle.delete({ where: { id: req.params.id } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "DELETE_VEHICLE", target: req.params.id });
    return ok(res, {}, "Vehicle removed");
  } catch (err) {
    next(err);
  }
});

// Availability calendar (SRS FR-7.2) — upcoming trips this vehicle is
// already booked for, so a dispatcher can see conflicts before assigning.
vehiclesRouter.get("/:id/schedule", requirePermission("vehicles", "view"), async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { vehicleId: req.params.id, clientId: req.clientId!, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      include: { booking: { include: { customer: true } } },
      orderBy: { startDate: "asc" },
    });
    return ok(res, trips);
  } catch (err) {
    next(err);
  }
});

// Documents with expiry tracking (RC/insurance/permit) — SRS FR-7.1.
// No S3 wiring yet (see Phase 5 note); fileUrl is a plain link the user
// supplies (e.g. a Google Drive link) until real upload storage exists.
const documentSchema = z.object({
  type: z.string().min(1),
  fileUrl: z.string().url(),
  expiryDate: z.coerce.date().optional(),
});

vehiclesRouter.post("/:id/documents", requirePermission("vehicles", "edit"), async (req, res, next) => {
  try {
    const input = documentSchema.parse(req.body);
    const vehicle = await prisma.vehicle.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!vehicle) return fail(res, 404, "Vehicle not found", "NOT_FOUND");

    const document = await prisma.document.create({
      data: { clientId: req.clientId!, vehicleId: vehicle.id, fileKey: input.fileUrl, uploadedBy: req.auth!.sub, ...input },
    });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "ADD_VEHICLE_DOCUMENT", target: document.id });
    return ok(res, document, "Document added");
  } catch (err) {
    next(err);
  }
});
