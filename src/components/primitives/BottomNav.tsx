"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, PencilLine, Lock, LockOpen, BarChart3, CircleUser } from "lucide-react";

const TABS = [
  { href: "/spieltag", icon: House, label: "Spieltag" },
  { href: "/tipps", icon: PencilLine, label: "Tipps" },
  { href: "/partner", icon: Lock, openIcon: LockOpen, label: "Nachbar" },
  { href: "/tabelle", icon: BarChart3, label: "Tabelle" },
  { href: "/profil", icon: CircleUser, label: "Profil" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="tabbar">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname?.startsWith(t.href + "/");
        const Icon = active && "openIcon" in t && t.openIcon ? t.openIcon : t.icon;
        return (
          <Link key={t.href} href={t.href} className={`tab${active ? " active" : ""}`}>
            <Icon size={24} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
