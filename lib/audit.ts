import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

interface WriteAuditLogParams {
  svjId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  payload?: Prisma.InputJsonValue;
  ip?: string;
  userAgent?: string;
}

export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  await db.auditLog.create({
    data: {
      svjId: params.svjId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      payload: params.payload,
      ip: params.ip,
      userAgent: params.userAgent,
    },
  });
}
