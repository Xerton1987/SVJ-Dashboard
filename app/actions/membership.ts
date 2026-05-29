"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

const grantRoleSchema = z.object({
  svjId: z.string().cuid(),
  userId: z.string().cuid(),
  role: z.nativeEnum(MemberRole),
});

const revokeRoleSchema = z.object({
  svjId: z.string().cuid(),
  membershipId: z.string().cuid(),
});

export async function grantRole(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = grantRoleSchema.safeParse({
    svjId: formData.get("svjId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  try {
    await requireRole(parsed.data.svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);

    const membership = await db.membership.upsert({
      where: {
        userId_svjId_role: {
          userId: parsed.data.userId,
          svjId: parsed.data.svjId,
          role: parsed.data.role,
        },
      },
      update: { revokedAt: null, grantedByUserId: session.user.id, grantedAt: new Date() },
      create: {
        userId: parsed.data.userId,
        svjId: parsed.data.svjId,
        role: parsed.data.role,
        grantedByUserId: session.user.id,
      },
    });

    await writeAuditLog({
      svjId: parsed.data.svjId,
      userId: session.user.id,
      action: "GRANT_ROLE",
      entityType: "Membership",
      entityId: membership.id,
      payload: { targetUserId: parsed.data.userId, role: parsed.data.role },
    });

    return { success: true as const, data: membership };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function revokeRole(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = revokeRoleSchema.safeParse({
    svjId: formData.get("svjId"),
    membershipId: formData.get("membershipId"),
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  try {
    await requireRole(parsed.data.svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);

    const membership = await db.membership.update({
      where: { id: parsed.data.membershipId },
      data: { revokedAt: new Date() },
    });

    await writeAuditLog({
      svjId: parsed.data.svjId,
      userId: session.user.id,
      action: "REVOKE_ROLE",
      entityType: "Membership",
      entityId: membership.id,
    });

    return { success: true as const, data: membership };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function listMembers(svjId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  try {
    const members = await db.membership.findMany({
      where: { svjId, revokedAt: null },
      include: { user: true },
      orderBy: { grantedAt: "desc" },
    });

    return { success: true as const, data: members };
  } catch {
    return { success: false as const, error: "Nepodařilo se načíst členy" };
  }
}
