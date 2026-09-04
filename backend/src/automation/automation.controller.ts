import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { requireEntitlement } from "../guards/entitlement.guard";
import { requirePermission } from "../guards/rbac.guard";
import { logTenantAction } from "../audit/audit.service";

export const automationRouter = Router();

// Workflow Automation is Business+ only (SRS section 6/FR-11).
automationRouter.use(authenticate, scopeTenant(), requireEntitlement("workflow_automation"));

const TRIGGER_TYPES = [
  "ENQUIRY_NO_CONTACT_WITHIN_HOURS",
  "QUOTATION_NOT_FOLLOWED_UP",
  "BOOKING_PAYMENT_OVERDUE",
  "VEHICLE_DOCUMENT_EXPIRING",
] as const;

const ACTION_TYPES = ["EMAIL_STAFF", "CREATE_FOLLOWUP_NOTE", "REASSIGN_ENQUIRY"] as const;

automationRouter.get("/options", requirePermission("settings", "view"), (_req, res) => {
  return ok(res, { triggerTypes: TRIGGER_TYPES, actionTypes: ACTION_TYPES });
});

automationRouter.get("/rules", requirePermission("settings", "view"), async (req, res, next) => {
  try {
    const rules = await prisma.automationRule.findMany({ where: { clientId: req.clientId! }, orderBy: { createdAt: "desc" } });
    return ok(res, rules);
  } catch (err) {
    next(err);
  }
});

const ruleSchema = z.object({
  name: z.string().min(1),
  triggerType: z.enum(TRIGGER_TYPES),
  triggerConfig: z.record(z.any()),
  actionType: z.enum(ACTION_TYPES),
  actionConfig: z.record(z.any()),
});

automationRouter.post("/rules", requirePermission("settings", "add"), async (req, res, next) => {
  try {
    const input = ruleSchema.parse(req.body);
    const rule = await prisma.automationRule.create({ data: { clientId: req.clientId!, ...input } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "CREATE_AUTOMATION_RULE", target: rule.id });
    return ok(res, rule, "Rule created");
  } catch (err) {
    next(err);
  }
});

automationRouter.patch("/rules/:id", requirePermission("settings", "edit"), async (req, res, next) => {
  try {
    const input = ruleSchema.partial().extend({ isActive: z.boolean().optional() }).parse(req.body);
    const existing = await prisma.automationRule.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Rule not found", "NOT_FOUND");

    const rule = await prisma.automationRule.update({ where: { id: req.params.id }, data: input });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "UPDATE_AUTOMATION_RULE", target: rule.id });
    return ok(res, rule, "Rule updated");
  } catch (err) {
    next(err);
  }
});

automationRouter.delete("/rules/:id", requirePermission("settings", "delete"), async (req, res, next) => {
  try {
    const existing = await prisma.automationRule.findFirst({ where: { id: req.params.id, clientId: req.clientId! } });
    if (!existing) return fail(res, 404, "Rule not found", "NOT_FOUND");

    await prisma.automationRule.delete({ where: { id: req.params.id } });
    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "DELETE_AUTOMATION_RULE", target: req.params.id });
    return ok(res, {}, "Rule deleted");
  } catch (err) {
    next(err);
  }
});

automationRouter.get("/logs", requirePermission("settings", "view"), async (req, res, next) => {
  try {
    const logs = await prisma.automationLog.findMany({
      where: { clientId: req.clientId! },
      include: { rule: { select: { name: true, triggerType: true, actionType: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(res, logs);
  } catch (err) {
    next(err);
  }
});
