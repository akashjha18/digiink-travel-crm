import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { sendMail } from "../email/email.service";

const connection = new IORedis(env.redisUrl, { maxRetriesPerRequest: null });

export const automationEngineQueue = new Queue("automation-engine", { connection });

// Cooldown windows per trigger type so the same target doesn't get
// re-flagged every sweep once its condition is already true.
const COOLDOWN_HOURS: Record<string, number> = {
  ENQUIRY_NO_CONTACT_WITHIN_HOURS: 24,
  QUOTATION_NOT_FOLLOWED_UP: 24,
  BOOKING_PAYMENT_OVERDUE: 24,
  VEHICLE_DOCUMENT_EXPIRING: 24 * 7,
};

async function alreadyFiredRecently(ruleId: string, targetId: string, cooldownHours: number): Promise<boolean> {
  const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
  const recent = await prisma.automationLog.findFirst({
    where: { ruleId, targetId, createdAt: { gte: since } },
  });
  return !!recent;
}

async function resolveActionRecipientEmail(clientId: string, actionConfig: any, fallbackAssignedToId?: string | null): Promise<string | null> {
  if (actionConfig.recipient === "SPECIFIC_USER" && actionConfig.userId) {
    const user = await prisma.user.findFirst({ where: { id: actionConfig.userId, clientId } });
    return user?.email ?? null;
  }
  if (actionConfig.recipient === "ASSIGNED_STAFF" && fallbackAssignedToId) {
    const user = await prisma.user.findFirst({ where: { id: fallbackAssignedToId, clientId } });
    return user?.email ?? null;
  }
  // Default: the Client Admin.
  const admin = await prisma.user.findFirst({ where: { clientId, isClientAdmin: true } });
  return admin?.email ?? null;
}

async function executeAction(rule: any, targetType: string, targetId: string, context: Record<string, unknown>) {
  const { actionType, actionConfig, clientId } = rule;

  if (actionType === "EMAIL_STAFF") {
    const email = await resolveActionRecipientEmail(clientId, actionConfig, context.assignedToId as string | undefined);
    if (email) {
      const subject = `[Digiink Automation] ${rule.name}`;
      const body = `Rule "${rule.name}" triggered for ${targetType.toLowerCase()} ${targetId}.\n\n${JSON.stringify(context, null, 2)}`;
      await sendMail(email, subject, body);
    }
  }

  if (actionType === "CREATE_FOLLOWUP_NOTE" && targetType === "ENQUIRY") {
    await prisma.followUp.create({
      data: {
        clientId, enquiryId: targetId, loggedById: (await prisma.user.findFirst({ where: { clientId, isClientAdmin: true } }))?.id ?? "system",
        activityType: "NOTE",
        description: `Automated: ${rule.name}`,
      },
    });
  }

  if (actionType === "REASSIGN_ENQUIRY" && targetType === "ENQUIRY" && actionConfig.toUserId) {
    await prisma.enquiry.update({ where: { id: targetId }, data: { assignedToId: actionConfig.toUserId } });
  }

  await prisma.automationLog.create({
    data: { clientId, ruleId: rule.id, targetType, targetId, message: `${rule.triggerType} -> ${rule.actionType}` },
  });
}

async function evaluateRule(rule: any) {
  const cooldown = COOLDOWN_HOURS[rule.triggerType] ?? 24;

  if (rule.triggerType === "ENQUIRY_NO_CONTACT_WITHIN_HOURS") {
    const hours = Number(rule.triggerConfig.hours ?? 2);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const candidates = await prisma.enquiry.findMany({
      where: { clientId: rule.clientId, status: { in: ["NEW", "CONTACTED"] }, createdAt: { lte: cutoff } },
      include: { followUps: { where: { activityType: { in: ["CALL", "FOLLOW_UP"] } }, take: 1 } },
    });

    for (const enquiry of candidates) {
      if (enquiry.followUps.length > 0) continue; // already contacted
      if (await alreadyFiredRecently(rule.id, enquiry.id, cooldown)) continue;
      await executeAction(rule, "ENQUIRY", enquiry.id, { destination: enquiry.destination, assignedToId: enquiry.assignedToId, ageHours: hours });
    }
  }

  if (rule.triggerType === "QUOTATION_NOT_FOLLOWED_UP") {
    const days = Number(rule.triggerConfig.days ?? 3);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const candidates = await prisma.quotation.findMany({
      where: { clientId: rule.clientId, status: "SENT", updatedAt: { lte: cutoff } },
      include: { enquiry: { select: { assignedToId: true } } },
    });

    for (const q of candidates) {
      if (await alreadyFiredRecently(rule.id, q.id, cooldown)) continue;
      await executeAction(rule, "QUOTATION", q.id, { version: q.version, assignedToId: q.enquiry.assignedToId, daysSinceSent: days });
    }
  }

  if (rule.triggerType === "BOOKING_PAYMENT_OVERDUE") {
    const bookings = await prisma.booking.findMany({
      where: { clientId: rule.clientId, status: { not: "CANCELLED" }, paymentDueDate: { lt: new Date() } },
      include: { payments: { select: { amountInPaise: true } } },
    });

    for (const b of bookings) {
      const paid = b.payments.reduce((sum, p) => sum + p.amountInPaise, 0);
      if (paid >= b.amountInPaise) continue; // fully paid
      if (await alreadyFiredRecently(rule.id, b.id, cooldown)) continue;
      await executeAction(rule, "BOOKING", b.id, { pendingInPaise: b.amountInPaise - paid, dueDate: b.paymentDueDate });
    }
  }

  if (rule.triggerType === "VEHICLE_DOCUMENT_EXPIRING") {
    const days = Number(rule.triggerConfig.days ?? 30);
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const vehicles = await prisma.vehicle.findMany({
      where: {
        clientId: rule.clientId,
        OR: [
          { rcExpiry: { lte: cutoff } },
          { insuranceExpiry: { lte: cutoff } },
          { permitExpiry: { lte: cutoff } },
        ],
      },
    });

    for (const v of vehicles) {
      if (await alreadyFiredRecently(rule.id, v.id, cooldown)) continue;
      await executeAction(rule, "VEHICLE", v.id, { registrationNumber: v.registrationNumber });
    }
  }
}

async function runAutomationSweep() {
  // Only clients whose plan actually includes workflow_automation and
  // whose subscription is in a usable state get their rules evaluated.
  const clients = await prisma.client.findMany({
    where: { subscriptionStatus: { in: ["ACTIVE", "EXPIRING_SOON", "GRACE"] } },
    include: { plan: true },
  });

  for (const client of clients) {
    const entitlements = client.plan.entitlements as Record<string, boolean>;
    if (!entitlements.workflow_automation) continue;

    const rules = await prisma.automationRule.findMany({ where: { clientId: client.id, isActive: true } });
    for (const rule of rules) {
      try {
        await evaluateRule(rule);
      } catch (err) {
        console.error(`Automation rule ${rule.id} (${rule.triggerType}) failed:`, err);
      }
    }
  }
}

new Worker("automation-engine", async () => { await runAutomationSweep(); }, { connection });

automationEngineQueue.add(
  "sweep", {},
  { repeat: { every: 15 * 60 * 1000 }, removeOnComplete: true, removeOnFail: true }
);
