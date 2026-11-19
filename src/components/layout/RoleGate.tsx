import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import type { Role } from "@/types";

export function RoleGate({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  if (role && roles.includes(role)) return <>{children}</>;
  return (
    <div className="surface-card mx-auto max-w-lg p-10 text-center">
      <h1 className="text-3xl">Nu ai acces aici</h1>
      <p className="mt-2 text-muted-foreground">Această secțiune nu este disponibilă pentru tipul tău de cont.</p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Înapoi la Dashboard</Link>
      </Button>
    </div>
  );
}
