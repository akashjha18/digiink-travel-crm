import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { requireEntitlement, enforceUsageLimit } from "../guards/entitlement.guard";
import { requirePermission } from "../guards/rbac.guard";
import { logTenantAction } from "../audit/audit.service";

export const enquiriesRouter = Router();

enquiriesRouter.use(authenticate, scopeTenant(), requireEntitlement("enquiry_crm"));

const PIPELINE_STAGES = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"] as const;

// --- List / filter ------------------------------------------------------------
enquiriesRouter.get("/", requirePermission("enquiries", "view"), async (req, res, next) => {
  try {
    const { status, assignedToId, source } = req.query as Record<string, string | undefined>;
    const enquiries = await prisma.enquiry.findMany({
      where: {
        clientId: req.clientId!,
        ...(status ? { status: status as any } : {}),
        ...(assignedToId ? { assignedToId } : {}),
        ...(source ? { source } : {}),
      },
      include: { customer: true, assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return ok(res, enquiries);
  } catch (err) {
    next(err);
  }
});

// --- Pipeline (Kanban) view: enquiries grouped by stage ----------------------
enquiriesRouter.get("/pipeline", requirePermission("enquiries", "view"), async (req, res, next) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      where: { clientId: req.clientId! },
      include: { customer: true, assignedTo: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });

    const grouped: Record<string, typeof enquiries> = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, []]));
    for (const enquiry of enquiries) {
      grouped[enquiry.status].push(enquiry);
    }
    return ok(res, grouped);
  } catch (err) {
    next(err);
  }
});

enquiriesRouter.get("/:id", requirePermission("enquiries", "view"), async (req, res, next) => {
  try {
    const enquiry = await prisma.enquiry.findFirst({
      where: { id: req.params.id, clientId: req.clientId! },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true } },
        followUps: { orderBy: { createdAt: "desc" }, include: { loggedBy: { select: { id: true, name: true } } } },
        quotations: { orderBy: { version: "desc" } },
      },
    });
    if (!enquiry) return fail(res, 404, "Enquiry not found", "NOT_FOUND");
    return ok(res, enquiry);
  } catch (err) {
    next(err);
  }
});

// --- Create -------------------------------------------------------------------
const createEnquirySchema = z.object({
  customerId: z.string().optional(),
  newCustomer: z.object({ name: z.string().min(1), phone: z.string().min(1), email: z.string().optional() }).optional(),
  source: z.string().optional(),
  destination: z.string().optional(),
  travelDate: z.coerce.date().optional(),
  assignTo: z.enum(["MANUAL", "ROUND_ROBIN", "NONE"]).default("NONE"),
  assignedToId: z.string().optional(),
  branchId: z.string().optional(),
}).refine((v) => v.customerId || v.newCustomer, { message: "customerId or newCustomer is required" });

enquiriesRouter.post("/", requirePermission("enquiries", "add"), async (req, res, next) => {
  try {
    const input = createEnquirySchema.parse(req.body);

    // Enforce max_enquiries_per_month if the plan sets one (SRS section 5/9).
    const plan = (req.client as any).plan;
    if (plan?.maxEnquiriesPerMonth !== null && plan?.maxEnquiriesPerMonth !== undefined) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const usedThisMonth = await prisma.enquiry.count({ where: { clientId: req.clientId!, createdAt: { gte: startOfMonth } } });
      if (!enforceUsageLimit(plan.maxEnquiriesPerMonth, usedThisMonth)) {
        return fail(res, 403, "You've reached your plan's enquiry limit for this month. Upgrade to add more.", "USAGE_LIMIT_REACHED");
      }
    }

    let customerId = input.customerId;
    if (!customerId && input.newCustomer) {
      const customer = await prisma.customer.create({ data: { clientId: req.clientId!, ...input.newCustomer } });
      customerId = customer.id;
    }

    let assignedToId: string | undefined;
    if (input.assignTo === "MANUAL") {
      assignedToId = input.assignedToId;
    } else if (input.assignTo === "ROUND_ROBIN") {
      assignedToId = await pickRoundRobinAssignee(req.clientId!);
    }

    // Default to the creating user's own branch if none given explicitly —
    // otherwise every enquiry lands in "unassigned" and the multi-branch
    // rollup dashboard never has anything to show (Enterprise/multi_branch
    // clients only; branchId stays null for everyone else, which is fine
    // since non-Enterprise plans never see branch UI anyway).
    const creator = await prisma.user.findUnique({ where: { id: req.auth!.sub }, select: { branchId: true } });

    const enquiry = await prisma.enquiry.create({
      data: {
        clientId: req.clientId!,
        customerId: customerId!,
        source: input.source,
        destination: input.destination,
        travelDate: input.travelDate,
        assignedToId,
        branchId: input.branchId ?? creator?.branchId ?? null,
      },
    });

    if (assignedToId) {
      await prisma.followUp.create({
        data: { clientId: req.clientId!, enquiryId: enquiry.id, loggedById: req.auth!.sub, activityType: "ASSIGNMENT_CHANGE", description: `Assigned on creation` },
      });
    }

    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "CREATE_ENQUIRY", target: enquiry.id });
    return ok(res, enquiry, "Enquiry created");
  } catch (err) {
    next(err);
  }
});

// Simplest fair round-robin: pick the active staff user (any role) with
// the fewest currently-assigned open enquiries. Good enough for Phase 4;
// a fairness/rotation-order guarantee can be revisited later if needed.
async function pickRoundRobinAssignee(clientId: string): Promise<string | undefined> {
  const staff = await prisma.user.findMany({ where: { clientId, isActive: true } });
  if (staff.length === 0) return undefined;

  const counts = await Promise.all(
    staff.map(async (u) => ({
      userId: u.id,
      count: await prisma.enquiry.count({ where: { clientId, assignedToId: u.id, status: { notIn: ["WON", "LOST"] } } }),
    }))
  );
  counts.sort((a, b) => a.count - b.count);
  return counts[0]?.userId;
}

// --- Update status (pipeline drag / manual change) ---------------------------
const updateStatusSchema = z.object({ status: z.enum(PIPELINE_STAGES) });

enquiriesRouter.patch("/:id/status", requirePermission("enquiries", "edit"), async (req, res, next) => {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const existing = await prisma.enquiry.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Enquiry not found", "NOT_FOUND");

    const enquiry = await prisma.enquiry.update({ where: { id: req.params.id }, data: { status } });
    await prisma.followUp.create({
      data: {
        clientId: req.clientId!, enquiryId: enquiry.id, loggedById: req.auth!.sub,
        activityType: "STATUS_CHANGE", description: `${existing.status} → ${status}`,
      },
    });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "UPDATE_ENQUIRY_STATUS", target: enquiry.id, metadata: { from: existing.status, to: status } });
    return ok(res, enquiry, "Status updated");
  } catch (err) {
    next(err);
  }
});

// --- Assign / reassign ---------------------------------------------------------
const assignSchema = z.object({ assignedToId: z.string().nullable() });

enquiriesRouter.patch("/:id/assign", requirePermission("enquiries", "edit"), async (req, res, next) => {
  try {
    const { assignedToId } = assignSchema.parse(req.body);
    const existing = await prisma.enquiry.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Enquiry not found", "NOT_FOUND");

    if (assignedToId) {
      const staffExists = await prisma.user.findFirst({ where: { id: assignedToId, clientId: req.clientId! } });
      if (!staffExists) return fail(res, 400, "Staff member not found", "BAD_REQUEST");
    }

    const enquiry = await prisma.enquiry.update({ where: { id: req.params.id }, data: { assignedToId } });
    await prisma.followUp.create({
      data: { clientId: req.clientId!, enquiryId: enquiry.id, loggedById: req.auth!.sub, activityType: "ASSIGNMENT_CHANGE", description: assignedToId ? `Reassigned` : "Unassigned" },
    });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "REASSIGN_ENQUIRY", target: enquiry.id });
    return ok(res, enquiry, "Enquiry reassigned");
  } catch (err) {
    next(err);
  }
});

// --- Follow-ups (activity timeline) -------------------------------------------
const followUpSchema = z.object({
  activityType: z.enum(["CALL", "NOTE", "FOLLOW_UP", "STATUS_CHANGE", "ASSIGNMENT_CHANGE"]),
  description: z.string().optional(),
});

enquiriesRouter.post("/:id/follow-ups", requirePermission("enquiries", "edit"), async (req, res, next) => {
  try {
    const input = followUpSchema.parse(req.body);
    const enquiry = await prisma.enquiry.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!enquiry) return fail(res, 404, "Enquiry not found", "NOT_FOUND");

    const followUp = await prisma.followUp.create({
      data: { clientId: req.clientId!, enquiryId: enquiry.id, loggedById: req.auth!.sub, ...input },
    });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "ADD_FOLLOWUP", target: followUp.id });
    return ok(res, followUp, "Follow-up logged");
  } catch (err) {
    next(err);
  }
});
