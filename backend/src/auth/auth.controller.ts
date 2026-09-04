import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { verifyPassword, hashPassword } from "./password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, signOtpPendingToken, verifyOtpPendingToken } from "./tokens";
import { ok, fail } from "../common/response";
import { computeEffectiveStatus } from "../subscriptions/subscription-state";
import { logTenantAction } from "../audit/audit.service";
import { authenticate } from "../guards/authenticate";
import { scopeTenant } from "../guards/tenant-scope.guard";
import { issueLoginOtp, verifyLoginOtp } from "./otp.service";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * OTP is temporarily disabled — a feature flag, not a rewrite, so it's a
 * one-line change to turn back on later. See OTP_LOGIN_ENABLED below and
 * the (still-intact) /verify-otp and /resend-otp routes.
 */
const OTP_LOGIN_ENABLED = false;

/**
 * Login. When OTP_LOGIN_ENABLED is true, client users go through the
 * two-step password -> emailed 6-digit code flow (SRS section 4.3/8,
 * email-only OTP). While disabled, client users get real tokens
 * immediately after password verification, same as Super Admin.
 */
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const superAdmin = await prisma.superAdminUser.findUnique({ where: { email } });
    if (superAdmin && (await verifyPassword(superAdmin.passwordHash, password))) {
      if (!superAdmin.isActive) return fail(res, 403, "Account disabled", "ACCOUNT_DISABLED");
      const accessToken = signAccessToken({ sub: superAdmin.id, role: "SUPER_ADMIN" });
      const refreshToken = signRefreshToken({ sub: superAdmin.id, role: "SUPER_ADMIN" });
      return ok(res, { accessToken, refreshToken, role: "SUPER_ADMIN" }, "Logged in");
    }

    const user = await prisma.user.findUnique({ where: { email }, include: { client: true } });
    if (!user || !user.isActive || !(await verifyPassword(user.passwordHash, password))) {
      return fail(res, 401, "Invalid credentials", "INVALID_CREDENTIALS");
    }

    if (OTP_LOGIN_ENABLED) {
      await issueLoginOtp(user.id, user.email);
      const otpToken = signOtpPendingToken({ sub: user.id, clientId: user.clientId });
      return ok(res, { otpRequired: true, otpToken }, "Enter the code we emailed you");
    }

    const { status } = computeEffectiveStatus({ subscriptionExpiry: user.client.subscriptionExpiry });

    const accessToken = signAccessToken({
      sub: user.id, clientId: user.clientId, role: "CLIENT_USER",
      roleId: user.roleId, isClientAdmin: user.isClientAdmin,
    });
    const refreshToken = signRefreshToken({ sub: user.id, clientId: user.clientId, role: "CLIENT_USER" });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await logTenantAction({ clientId: user.clientId, userId: user.id, action: "LOGIN" });

    return ok(res, {
      accessToken, refreshToken, role: "CLIENT_USER",
      subscriptionStatus: status,
      mustChangePassword: user.mustChangePassword,
      onboardingCompleted: user.client.onboardingCompleted,
    }, "Logged in");
  } catch (err) {
    return next(err);
  }
});

const verifyOtpSchema = z.object({
  otpToken: z.string(),
  code: z.string().length(6),
});

authRouter.post("/verify-otp", async (req, res, next) => {
  try {
    const { otpToken, code } = verifyOtpSchema.parse(req.body);
    const pending = verifyOtpPendingToken(otpToken);

    const isValid = await verifyLoginOtp(pending.sub, code);
    if (!isValid) return fail(res, 400, "Invalid or expired code", "INVALID_OTP");

    const user = await prisma.user.findUniqueOrThrow({ where: { id: pending.sub }, include: { client: true } });
    const { status } = computeEffectiveStatus({ subscriptionExpiry: user.client.subscriptionExpiry });

    const accessToken = signAccessToken({
      sub: user.id, clientId: user.clientId, role: "CLIENT_USER",
      roleId: user.roleId, isClientAdmin: user.isClientAdmin,
    });
    const refreshToken = signRefreshToken({ sub: user.id, clientId: user.clientId, role: "CLIENT_USER" });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await logTenantAction({ clientId: user.clientId, userId: user.id, action: "LOGIN" });

    return ok(res, {
      accessToken, refreshToken, role: "CLIENT_USER",
      subscriptionStatus: status,
      mustChangePassword: user.mustChangePassword,
      onboardingCompleted: user.client.onboardingCompleted,
    }, "Logged in");
  } catch (err) {
    return next(err);
  }
});

authRouter.post("/resend-otp", async (req, res, next) => {
  try {
    const { otpToken } = z.object({ otpToken: z.string() }).parse(req.body);
    const pending = verifyOtpPendingToken(otpToken);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: pending.sub } });
    await issueLoginOtp(user.id, user.email);
    return ok(res, {}, "Code resent");
  } catch (err) {
    return next(err);
  }
});

const refreshSchema = z.object({ refreshToken: z.string() });

authRouter.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ sub: payload.sub, clientId: payload.clientId, role: payload.role });
    return ok(res, { accessToken }, "Token refreshed");
  } catch {
    return fail(res, 401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

authRouter.post("/change-password", authenticate, scopeTenant(["ACTIVE", "EXPIRING_SOON", "GRACE", "LOCKED"]), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const userId = req.auth!.sub;

    // Scoped by clientId even though `id` alone would suffice, so this
    // handler stays consistent with the "every query is clientId-scoped"
    // rule everywhere else in the codebase.
    const user = await prisma.user.findFirstOrThrow({ where: { id: userId, clientId: req.clientId! } });
    if (!(await verifyPassword(user.passwordHash, currentPassword))) {
      return fail(res, 400, "Current password is incorrect", "INVALID_CURRENT_PASSWORD");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword), mustChangePassword: false },
    });
    await logTenantAction({ clientId: req.clientId!, userId, action: "CHANGE_PASSWORD" });

    return ok(res, {}, "Password updated");
  } catch (err) {
    return next(err);
  }
});
