import { Suspense } from "react";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata = {
  title: "Přihlášení — SVJ Dashboard",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
