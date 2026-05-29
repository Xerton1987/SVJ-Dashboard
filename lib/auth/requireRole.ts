import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MemberRole } from "@prisma/client";

export { MemberRole };

/**
 * Throws if the current user doesn't have at least one of the required roles in the given SVJ.
 */
export async function requireRole(
  svjId: string,
  ...roles: MemberRole[]
): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Nepřihlášený uživatel");
  }

  const membership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      svjId,
      role: { in: roles },
      revokedAt: null,
    },
  });

  if (!membership) {
    throw new Error("Nedostatečná oprávnění pro tuto operaci");
  }
}
