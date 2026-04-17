"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileAudio, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardIconName = "recordings" | "analytics" | "scholars" | "settings";

const ICONS_BY_NAME = {
  recordings: FileAudio,
  analytics: BarChart3,
  scholars: Users,
  settings: Settings,
} as const;

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardIconName;
};

type DashboardNavProps = {
  items: DashboardNavItem[];
  className?: string;
  mobile?: boolean;
};

export function DashboardNav({ items, className, mobile = false }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        mobile
          ? "rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_oklab,_var(--card)_90%,_black)] p-2 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.9)]"
          : "space-y-1",
        className
      )}
      aria-label="Dashboard navigatie"
    >
      <ul className={cn(mobile ? "grid grid-cols-4 gap-2" : "space-y-1") }>
        {items.map((item) => {
          const Icon = ICONS_BY_NAME[item.icon];
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                  mobile ? "justify-center text-xs" : "font-medium",
                  isActive
                    ? "bg-white/12 text-white"
                    : "text-slate-300 hover:bg-white/7 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn(mobile ? "sr-only" : "inline")}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
