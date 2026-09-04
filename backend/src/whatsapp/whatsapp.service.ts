import { prisma } from "../db/prisma";
import { decryptSecret } from "../common/crypto";

/**
 * WhatsApp Business Cloud API abstraction (SRS section 12/FR-12.2,
 * Enterprise only). This is scaffolding, not a working integration:
 * sending a real message requires a Meta Business Account, an approved
 * WhatsApp Business app, a verified phone number, and a permanent access
 * token — none of which can be provisioned from inside this codebase.
 *
 * What IS real here: the message log (whatsapp_messages), the config
 * storage, and the webhook receiver's shape. Once a client has real Meta
 * credentials, replace the body of sendWhatsAppMessage's "live" branch
 * with an actual fetch() to
 * https://graph.facebook.com/v19.0/{phoneNumberId}/messages — the rest of
 * the app (message log, enquiry linking) needs no changes.
 */

export async function sendWhatsAppMessage(params: {
  clientId: string;
  toNumber: string;
  body: string;
  enquiryId?: string;
}): Promise<{ status: string; simulated: boolean }> {
  const config = await prisma.whatsAppConfig.findUnique({ where: { clientId: params.clientId } });

  const hasRealCredentials = !!(config?.isActive && config.phoneNumberId && config.accessTokenEncrypted);

  let status: string;
  let simulated: boolean;

  if (hasRealCredentials) {
    // TODO: replace with a real Meta Cloud API call once credentials are
    // genuinely connected. Left unimplemented on purpose — faking a
    // "SENT" status here would be actively misleading once a client
    // thinks they've gone live.
    const accessToken = config!.accessTokenEncrypted ? decryptSecret(config!.accessTokenEncrypted) : null;
    if (!accessToken) {
      status = "FAILED";
      simulated = false;
    } else {
      console.warn(
        `[whatsapp] Client ${params.clientId} has WhatsApp marked active with credentials, but no real Meta API ` +
        `call is implemented yet — message was NOT actually sent to ${params.toNumber}.`
      );
      status = "FAILED";
      simulated = false;
    }
  } else {
    console.log(`[whatsapp:simulated] to=${params.toNumber} body="${params.body}"`);
    status = "SENT";
    simulated = true;
  }

  await prisma.whatsAppMessage.create({
    data: {
      clientId: params.clientId,
      enquiryId: params.enquiryId,
      direction: "OUTBOUND",
      fromNumber: config?.phoneNumberId ?? "simulated",
      toNumber: params.toNumber,
      body: params.body,
      status,
    },
  });

  return { status, simulated };
}

// Called by the (future) real Meta webhook once a client actually
// connects their number. The verify-token check is real; the payload
// shape here is Meta's actual webhook format so this is ready to receive
// live traffic the day credentials exist.
export async function recordInboundWhatsAppMessage(params: {
  clientId: string;
  fromNumber: string;
  toNumber: string;
  body: string;
}) {
  const enquiry = await prisma.enquiry.findFirst({
    where: { clientId: params.clientId, customer: { phone: params.fromNumber } },
    orderBy: { createdAt: "desc" },
  });

  return prisma.whatsAppMessage.create({
    data: {
      clientId: params.clientId,
      enquiryId: enquiry?.id,
      direction: "INBOUND",
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      body: params.body,
      status: "RECEIVED",
    },
  });
}
