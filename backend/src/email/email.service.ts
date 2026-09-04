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
