import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { requireEntitlement } from "../guards/entitlement.guard";
import { requirePermission } from "../guards/rbac.guard";
import { logTenantAction } from "../audit/audit.service";

export const driversRouter = Router();

// Driver Records & Assignment is Professional+ (SRS section 6/FR-6).
driversRouter.use(authenticate, scopeTenant(), requireEntitlement("drivers"));

driversRouter.get("/", requirePermission("drivers", "view"), async (req, res, next) => {
  try {
    const isAuthUserDriver = req.auth!.roleId
      ? await prisma.role.findFirst({ where: { id: req.auth!.roleId, clientId: req.clientId!, name: "Driver" } })
      : null;

    // SRS FR-6.3: a user in the "Driver" role only ever sees their own
    // record and assigned trips, never the full roster. Client Admin and
    // every other role sees everyone, gated by the normal RBAC check above.
    const drivers = await prisma.driver.findMany({
      where: { clientId: req.clientId!, ...(isAuthUserDriver ? { id: req.auth!.sub } : {}) },
      include: { vehicles: { select: { id: true, registrationNumber: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(res, drivers);
  } catch (err) {
    next(err);
  }
});

driversRouter.get("/:id", requirePermission("drivers", "view"), async (req, res, next) => {
  try {
    const driver = await prisma.driver.findFirst({
      where: { id: req.params.id, clientId: req.clientId! },
      include: {
        vehicles: true,
        documents: true,
        trips: { orderBy: { startDate: "desc" }, take: 20, include: { booking: { select: { id: true } } } },
      },
    });
    if (!driver) return fail(res, 404, "Driver not found", "NOT_FOUND");
    return ok(res, driver);
  } catch (err) {
    next(err);
  }
});

const driverSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  contact: z.string().min(1),
});

driversRouter.post("/", requirePermission("drivers", "add"), async (req, res, next) => {
  try {
    const input = driverSchema.parse(req.body);
    const driver = await prisma.driver.create({ data: { clientId: req.clientId!, ...input } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "CREATE_DRIVER", target: driver.id });
    return ok(res, driver, "Driver added");
  } catch (err) {
    next(err);
  }
});

driversRouter.patch("/:id", requirePermission("drivers", "edit"), async (req, res, next) => {
  try {
    const input = driverSchema.partial().extend({ isAvailable: z.boolean().optional() }).parse(req.body);
    const existing = await prisma.driver.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Driver not found", "NOT_FOUND");

    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: input });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "UPDATE_DRIVER", target: driver.id });
    return ok(res, driver, "Driver updated");
  } catch (err) {
    next(err);
  }
});

driversRouter.delete("/:id", requirePermission("drivers", "delete"), async (req, res, next) => {
  try {
    const existing = await prisma.driver.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Driver not found", "NOT_FOUND");

    const activeTrip = await prisma.trip.findFirst({ where: { driverId: req.params.id, status: { in: ["SCHEDULED", "IN_PROGRESS"] } } });
    if (activeTrip) return fail(res, 400, "This driver has an active or upcoming trip and cannot be removed", "DRIVER_HAS_ACTIVE_TRIP");

    await prisma.driver.delete({ where: { id: req.params.id } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "DELETE_DRIVER", target: req.params.id });
    return ok(res, {}, "Driver removed");
  } catch (err) {
    next(err);
  }
});

// Driver's own restricted schedule view (SRS FR-6.3).
driversRouter.get("/:id/schedule", requirePermission("drivers", "view"), async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { driverId: req.params.id, clientId: req.clientId! },
      include: { booking: { include: { customer: true } }, vehicle: true },
      orderBy: { startDate: "asc" },
    });
    return ok(res, trips);
  } catch (err) {
    next(err);
  }
});

// Documents (license copy, etc.) — SRS FR-6.1. No S3 wiring yet (see the
// Phase 5 note in README); fileUrl is a plain link the user supplies
// until real upload storage exists, same pattern as vehicle documents.
const documentSchema = z.object({
  type: z.string().min(1),
  fileUrl: z.string().url(),
  expiryDate: z.coerce.date().optional(),
});

driversRouter.post("/:id/documents", requirePermission("drivers", "edit"), async (req, res, next) => {
  try {
    const input = documentSchema.parse(req.body);
    const driver = await prisma.driver.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!driver) return fail(res, 404, "Driver not found", "NOT_FOUND");

    const document = await prisma.document.create({
      data: { clientId: req.clientId!, driverId: driver.id, fileKey: input.fileUrl, uploadedBy: req.auth!.sub, ...input },
    });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "ADD_DRIVER_DOCUMENT", target: document.id });
    return ok(res, document, "Document added");
  } catch (err) {
    next(err);
  }
});
