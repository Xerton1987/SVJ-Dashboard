"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  MessageSquare,
  Vote,
  Building2,
  Users,
  Upload,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Domů", icon: Home },
  { href: "/jednotky", label: "Jednotky", icon: Building2 },
  { href: "/clenove", label: "Členové", icon: Users },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/nastenkа", label: "Nástěnka", icon: MessageSquare },
  { href: "/hlasovani", label: "Hlasování", icon: Vote },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/nastaveni", label: "Nastavení", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen border-r bg-background">
      <div className="p-6">
        <h2 className="text-lg font-semibold">SVJ Dashboard</h2>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
