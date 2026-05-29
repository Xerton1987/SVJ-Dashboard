"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/requireRole";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

const createEntranceSchema = z.object({
  buildingId: z.string().cuid(),
  svjId: z.string().cuid(),
  cislo: z.string().min(1),
  popis: z.string().optional(),
});

export async function createEntrance(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false as const, error: "Nepřihlášený uživatel" };
  }

  const parsed = createEntranceSchema.safeParse({
    buildingId: formData.get("buildingId"),
    svjId: formData.get("svjId"),
    cislo: formData.get("cislo"),
    popis: formData.get("popis") || undefined,
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Chybná data" };
  }

  const { svjId, buildingId, ...data } = parsed.data;

  try {
    await requireRole(svjId, MemberRole.COMMITTEE_CHAIR, MemberRole.EXTERNAL_MANAGER);

    const entrance = await db.entrance.create({ data: { ...data, buildingId } });

    await writeAuditLog({
      svjId,
      userId: session.user.id,
      action: "CREATE",
      entityType: "Entrance",
      entityId: entrance.id,
    });

    return { success: true as const, data: entrance };
  } catch (e) {
    return { success: false as const, error: (e as Error).message };
  }
}
