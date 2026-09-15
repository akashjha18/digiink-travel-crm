import nodemailer from "nodemailer";
import { env } from "../config/env";

// Thin abstraction over the SMTP transport so switching to Amazon SES or
// Postmark later is a one-file change, per SRS section 31.
const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    })
  : null;

export async function sendMail(to: string, subject: string, text: string) {
  if (!transporter) {
    console.log(`[email:dev-mode] to=${to} subject="${subject}" body="${text}"`);
    return;
  }
  await transporter.sendMail({ from: env.smtp.from, to, subject, text });
}

export interface SendHtmlMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export async function sendHtmlMail(options: SendHtmlMailOptions) {
  const { to, subject, html, text, companyName = "Digiink Travel CRM", logoUrl, primaryColor = "#0284c7" } = options;

  const plainTextFallback = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // If html is already a full HTML document, use as-is
  const formattedHtml = html.includes("<html")
    ? html
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
    .email-container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .email-header { background-color: ${primaryColor}; padding: 24px; text-align: center; color: #ffffff; }
    .email-header img { max-height: 50px; max-width: 200px; object-fit: contain; margin-bottom: 8px; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .email-body { padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #334155; }
    .email-body p { margin: 0 0 16px; }
    .email-footer { background-color: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" /><br/>` : ""}
      <h1>${companyName}</h1>
    </div>
    <div class="email-body">
      ${html}
    </div>
    <div class="email-footer">
      <p style="margin:0;">Sent via ${companyName} &bull; All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

  if (!transporter) {
    console.log(`[email:html:dev-mode] to=${to} subject="${subject}" bodyPreview="${plainTextFallback.slice(0, 100)}..."`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text: plainTextFallback,
      html: formattedHtml,
    });
    return { success: true, messageId: info.messageId, simulated: false };
  } catch (err: any) {
    console.error("[email:send-error]", err);
    return { success: false, error: err.message };
  }
}
