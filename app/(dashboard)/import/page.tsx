import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CsvImportForm } from "@/components/forms/CsvImportForm";

export const metadata = { title: "Import — SVJ Dashboard" };

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, revokedAt: null },
    orderBy: { grantedAt: "asc" },
  });

  if (!membership) redirect("/onboarding");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import vlastníků</h1>
      <p className="text-muted-foreground">
        Importujte vlastníky jednotek ze souboru CSV. Formát: jednotka, jméno, podíl (např. 1/3), e-mail, telefon
      </p>
      <CsvImportForm svjId={membership.svjId} />
    </div>
  );
}
