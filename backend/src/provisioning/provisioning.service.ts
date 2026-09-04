import crypto from "crypto";
import { prisma } from "../db/prisma";
import { hashPassword, generateTemporaryPassword } from "../auth/password";
import { logSuperAdminAction } from "../audit/audit.service";

function slugify(businessName: string): string {
  return businessName.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8);
}

/**
 * "Create Client" flow, rewritten for the single shared-database
 * architecture: there is no CREATE DATABASE step anymore — provisioning a
 * client now means inserting a Client row, its default "Client Admin"
 * Role (scoped to that client), and the initial admin User, all within
 * one transaction so a half-created client is never left behind.
 */
export async function provisionNewClient(params: {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  planId: string;
  subscriptionStart: Date;
  subscriptionExpiry: Date;
  actorId: string;
  actorEmail: string;
}) {
  const clientCode = `${slugify(params.businessName)}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const temporaryPassword = generateTemporaryPassword();

  const { client, adminUser } = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        clientCode,
        businessName: params.businessName,
        ownerName: params.ownerName,
        email: params.email,
        phone: params.phone,
        planId: params.planId,
        subscriptionStatus: "ACTIVE",
        subscriptionStart: params.subscriptionStart,
        subscriptionExpiry: params.subscriptionExpiry,
      },
    });

    const adminRole = await tx.role.create({
      data: {
        clientId: client.id,
        name: "Client Admin",
        isSystemRole: true,
        permissionsJson: buildFullAccessPermissions(),
      },
    });

    const adminUser = await tx.user.create({
      data: {
        clientId: client.id,
        name: params.ownerName,
        email: params.email,
        passwordHash: await hashPassword(temporaryPassword),
        roleId: adminRole.id,
        isClientAdmin: true,
        mustChangePassword: true,
      },
    });

    return { client, adminUser };
  });

  await logSuperAdminAction({
    actorId: params.actorId,
    actorEmail: params.actorEmail,
    action: "CREATE_CLIENT",
    targetClientId: client.id,
    metadata: { businessName: params.businessName, planId: params.planId, adminUserId: adminUser.id },
  });

  return { client, temporaryPassword };
}

function buildFullAccessPermissions() {
  const modules = [
    "dashboard", "customers", "enquiries", "quotations", "bookings",
    "trips", "drivers", "vehicles", "payments", "invoices", "reports",
    "staff", "settings",
  ];
  const grid: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean; export: boolean }> = {};
  for (const module of modules) {
    grid[module] = { view: true, add: true, edit: true, delete: true, export: true };
  }
  return grid;
}
