import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Členové — SVJ Dashboard" };

const roleLabels: Record<string, string> = {
  MEMBER: "Člen",
  TENANT: "Nájemník",
  COMMITTEE_MEMBER: "Člen výboru",
  COMMITTEE_CHAIR: "Předseda výboru",
  EXTERNAL_MANAGER: "Externí správce",
  AUDITOR: "Revizor",
  GUEST: "Host",
};

const roleVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMMITTEE_CHAIR: "default",
  COMMITTEE_MEMBER: "secondary",
  EXTERNAL_MANAGER: "outline",
  AUDITOR: "outline",
  MEMBER: "secondary",
  TENANT: "outline",
  GUEST: "outline",
};

export default async function ClenovePageComponent() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { grantedAt: "asc" },
  });

  if (!membership) redirect("/onboarding");

  const members = await db.membership.findMany({
    where: { svjId: membership.svjId, revokedAt: null },
    include: { user: true },
    orderBy: { grantedAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Členové</h1>
      <Card>
        <CardHeader>
          <CardTitle>Seznam členů ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Žádní členové nenalezeni</p>
            ) : (
              members.map((m: (typeof members)[number]) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">
                      {m.user.name ?? (`${m.user.jmeno ?? ""} ${m.user.prijmeni ?? ""}`.trim() || m.user.email)}
                    </div>
                    <div className="text-sm text-muted-foreground">{m.user.email}</div>
                    {m.user.telefon && (
                      <div className="text-xs text-muted-foreground">{m.user.telefon}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={roleVariants[m.role] ?? "outline"}>
                      {roleLabels[m.role] ?? m.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      od {new Date(m.grantedAt).toLocaleDateString("cs-CZ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
