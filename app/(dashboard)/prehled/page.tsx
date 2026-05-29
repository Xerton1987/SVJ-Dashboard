import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Activity } from "lucide-react";

export const metadata = { title: "Přehled — SVJ Dashboard" };

export default async function DashboardHomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, revokedAt: null },
    include: { svj: true },
    orderBy: { grantedAt: "asc" },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const svjId = membership.svj.id;

  const [unitCount, memberCount, recentLogs] = await Promise.all([
    db.unit.count({
      where: { entrance: { building: { svjId } } },
    }),
    db.membership.count({ where: { svjId, revokedAt: null } }),
    db.auditLog.findMany({
      where: { svjId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vítejte v SVJ Dashboard</h1>
        <p className="text-muted-foreground">{membership.svj.nazev}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Počet jednotek</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unitCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Počet členů</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nedávná aktivita</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentLogs.length}</div>
            <p className="text-xs text-muted-foreground">posledních záznamů</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nedávná aktivita</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Zatím žádná aktivita.</p>
          ) : (
            <ul className="space-y-3">
              {recentLogs.map((log: (typeof recentLogs)[number]) => (
                <li key={log.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {log.action}
                  </span>
                  <div>
                    <span className="font-medium">{log.entityType}</span>
                    {log.user && (
                      <span className="text-muted-foreground"> · {log.user.name ?? log.user.email}</span>
                    )}
                    <span className="text-muted-foreground"> · {new Date(log.createdAt).toLocaleString("cs-CZ")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
