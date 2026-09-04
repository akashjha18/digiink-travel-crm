import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { ok, fail } from "../common/response";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { requireEntitlement } from "../guards/entitlement.guard";
import { requirePermission } from "../guards/rbac.guard";
import { encryptSecret } from "../common/crypto";
import { logTenantAction } from "../audit/audit.service";
import { sendWhatsAppMessage, recordInboundWhatsAppMessage } from "./whatsapp.service";

export const whatsappRouter = Router();

// WhatsApp Business API integration is Enterprise only (SRS section
// 12/FR-12.2, entitlement key "integrations"). See whatsapp.service.ts
// for why sending is simulated rather than live.
whatsappRouter.use(authenticate, scopeTenant(), requireEntitlement("integrations"));

whatsappRouter.get("/config", requirePermission("settings", "view"), async (req, res, next) => {
  try {
    const config = await prisma.whatsAppConfig.findUnique({ where: { clientId: req.clientId! } });
    if (!config) return ok(res, null);
    // Never return the encrypted token itself, only whether one is set.
    const { accessTokenEncrypted, ...safe } = config;
    return ok(res, { ...safe, hasAccessToken: !!accessTokenEncrypted });
  } catch (err) {
    next(err);
  }
});

const configSchema = z.object({
  phoneNumberId: z.string().optional(),
  businessAccountId: z.string().optional(),
  accessToken: z.string().optional(),
  webhookVerifyToken: z.string().optional(),
  isActive: z.boolean().optional(),
});

whatsappRouter.post("/config", requirePermission("settings", "edit"), async (req, res, next) => {
  try {
    const input = configSchema.parse(req.body);
    const { accessToken, ...rest } = input;

    const config = await prisma.whatsAppConfig.upsert({
      where: { clientId: req.clientId! },
      update: { ...rest, ...(accessToken ? { accessTokenEncrypted: encryptSecret(accessToken) } : {}) },
      create: { clientId: req.clientId!, ...rest, accessTokenEncrypted: accessToken ? encryptSecret(accessToken) : null },
    });

    await logTenantAction({ clientId: req.clientId!, userId: req.auth!.sub, action: "UPDATE_WHATSAPP_CONFIG" });
    const { accessTokenEncrypted, ...safe } = config;
    return ok(res, { ...safe, hasAccessToken: !!accessTokenEncrypted }, "WhatsApp settings saved");
  } catch (err) {
    next(err);
  }
});

whatsappRouter.get("/messages", requirePermission("enquiries", "view"), async (req, res, next) => {
  try {
    const { enquiryId } = req.query as Record<string, string | undefined>;
    const messages = await prisma.whatsAppMessage.findMany({
      where: { clientId: req.clientId!, ...(enquiryId ? { enquiryId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return ok(res, messages);
  } catch (err) {
    next(err);
  }
});

const sendSchema = z.object({ toNumber: z.string().min(1), body: z.string().min(1), enquiryId: z.string().optional() });

whatsappRouter.post("/send", requirePermission("enquiries", "edit"), async (req, res, next) => {
  try {
    const input = sendSchema.parse(req.body);
    const result = await sendWhatsAppMessage({ clientId: req.clientId!, ...input });

    if (!result.simulated && result.status === "FAILED") {
      return fail(res, 502, "WhatsApp is configured but no live API integration exists yet — message was logged but not delivered.", "WHATSAPP_NOT_LIVE");
    }

    return ok(res, result, result.simulated ? "Message simulated (no live WhatsApp connection configured)" : "Message sent");
  } catch (err) {
    next(err);
  }
});

// --- Public webhook (no JWT — Meta calls this directly) -----------------------
// Mounted separately in routes/index.ts at /api/whatsapp-webhook/:clientId
// (a distinct path prefix from /api/whatsapp — see the comment there for
// why they can't share one). Verified via each client's own
// webhookVerifyToken. URL shape gives each client a distinct callback URL,
// matching Meta's one-webhook-URL-per-app model.
export const whatsappWebhookRouter = Router();

whatsappWebhookRouter.get("/:clientId", async (req, res) => {
  const config = await prisma.whatsAppConfig.findUnique({ where: { clientId: req.params.clientId } });
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && config?.webhookVerifyToken && token === config.webhookVerifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

const webhookPayloadSchema = z.object({
  from: z.string(),
  to: z.string().optional(),
  body: z.string(),
});

whatsappWebhookRouter.post("/:clientId", async (req, res, next) => {
  try {
    // Real Meta payloads are nested (entry[].changes[].value.messages[]);
    // this accepts a flattened shape so the receiver is testable today,
    // with the real unwrapping left as the one piece to add once a
    // genuine Meta webhook is pointed at this URL.
    const input = webhookPayloadSchema.parse(req.body);
    await recordInboundWhatsAppMessage({
      clientId: req.params.clientId,
      fromNumber: input.from,
      toNumber: input.to ?? "unknown",
      body: input.body,
    });
    return res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});
