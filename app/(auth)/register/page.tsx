import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata = {
  title: "Registrace — SVJ Dashboard",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <RegisterForm />
    </div>
  );
}
