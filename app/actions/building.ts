"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

const createBuildingSchema = z.object({
  svjId: z.string().cuid(),
  adresa: z.string().min(1),
  popiscneCislo: z.string().optional(),
  parcelaKn: z.string().optional(),
});

const updateBuildingSchema = z.object({
  buildingId: z.string().cuid(),
  svjId: z.string().cuid(),
  adresa: z.string().min(1).optional(),
  popiscneCislo: z.string().optional(),
  parcelaKn: z.string().optional(),
  pocetJednotek: z.number().int().nonnegative().optional(),
});

export async function createBuilding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = createBuildingSchema.safeParse({
    svjId: formData.get("svjId"),
    adresa: formData.get("adresa"),
    popiscneCislo: formData.get("popiscneCislo") || undefined,
    parcelaKn: formData.get("parcelaKn") || undefined,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  try {
    await requireRole(parsed.data.svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);

    const building = await db.building.create({ data: parsed.data });

    await writeAuditLog({
      svjId: parsed.data.svjId,
      userId: session.user.id,
      action: "CREATE",
      entityType: "Building",
      entityId: building.id,
    });

    return { success: true as const, data: building };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function updateBuilding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = updateBuildingSchema.safeParse({
    buildingId: formData.get("buildingId"),
    svjId: formData.get("svjId"),
    adresa: formData.get("adresa") || undefined,
    popiscneCislo: formData.get("popiscneCislo") || undefined,
    parcelaKn: formData.get("parcelaKn") || undefined,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  const { buildingId, svjId, ...data } = parsed.data;

  try {
    await requireRole(svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);

    const building = await db.building.update({ where: { id: buildingId }, data });

    await writeAuditLog({
      svjId,
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Building",
      entityId: buildingId,
    });

    return { success: true as const, data: building };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}
