"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import { MemberRole, UnitType } from "@prisma/client";
import Decimal from "decimal.js";

const createUnitSchema = z.object({
  entranceId: z.string().cuid(),
  svjId: z.string().cuid(),
  cisloJednotkyKn: z.string().min(1),
  plochaMq: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "Plocha musí být kladné číslo",
  }),
  spoluvlPodilCitatel: z.coerce.number().int().positive(),
  spoluvlPodilJmenovatel: z.coerce.number().int().positive(),
  typ: z.nativeEnum(UnitType).default(UnitType.BYT),
  pocetOsob: z.coerce.number().int().nonnegative().default(0),
});

const updateUnitSchema = z.object({
  unitId: z.string().cuid(),
  svjId: z.string().cuid(),
  cisloJednotkyKn: z.string().min(1).optional(),
  plochaMq: z.string().optional(),
  typ: z.nativeEnum(UnitType).optional(),
  pocetOsob: z.coerce.number().int().nonnegative().optional(),
});

export async function createUnit(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = createUnitSchema.safeParse({
    entranceId: formData.get("entranceId"),
    svjId: formData.get("svjId"),
    cisloJednotkyKn: formData.get("cisloJednotkyKn"),
    plochaMq: formData.get("plochaMq"),
    spoluvlPodilCitatel: formData.get("spoluvlPodilCitatel"),
    spoluvlPodilJmenovatel: formData.get("spoluvlPodilJmenovatel"),
    typ: formData.get("typ") || undefined,
    pocetOsob: formData.get("pocetOsob") || 0,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  const { svjId, plochaMq, ...data } = parsed.data;

  try {
    await requireRole(svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);

    const unit = await db.unit.create({
      data: {
        ...data,
        plochaMq: new Decimal(plochaMq),
      },
    });

    await writeAuditLog({
      svjId,
      userId: session.user.id,
      action: "CREATE",
      entityType: "Unit",
      entityId: unit.id,
    });

    return { success: true as const, data: unit };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function updateUnit(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = updateUnitSchema.safeParse({
    unitId: formData.get("unitId"),
    svjId: formData.get("svjId"),
    cisloJednotkyKn: formData.get("cisloJednotkyKn") || undefined,
    plochaMq: formData.get("plochaMq") || undefined,
    typ: formData.get("typ") || undefined,
    pocetOsob: formData.get("pocetOsob") || undefined,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  const { unitId, svjId, plochaMq, ...data } = parsed.data;

  try {
    await requireRole(svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);

    const updateData: Record<string, unknown> = { ...data };
    if (plochaMq) updateData.plochaMq = new Decimal(plochaMq);

    const unit = await db.unit.update({ where: { id: unitId }, data: updateData });

    await writeAuditLog({
      svjId,
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Unit",
      entityId: unitId,
    });

    return { success: true as const, data: unit };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}

export async function getUnit(unitId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  try {
    const unit = await db.unit.findUnique({
      where: { id: unitId },
      include: {
        entrance: { include: { building: true } },
        ownerships: { include: { user: true }, where: { validTo: null } },
        tenancies: { include: { user: true }, where: { validTo: null } },
      },
    });

    if (!unit) {
      return { success: false as const, error: "Jednotka nenalezena" };
    }

    return { success: true as const, data: unit };
  } catch {
    return { success: false as const, error: "Nepodařilo se načíst jednotku" };
  }
}

export async function listUnits(svjId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  try {
    const units = await db.unit.findMany({
      where: {
        entrance: {
          building: { svjId },
        },
      },
      include: {
        entrance: { include: { building: true } },
        ownerships: {
          include: { user: true },
          where: { validTo: null },
        },
      },
      orderBy: { cisloJednotkyKn: "asc" },
    });

    return { success: true as const, data: units };
  } catch {
    return { success: false as const, error: "Nepodařilo se načíst jednotky" };
  }
}
