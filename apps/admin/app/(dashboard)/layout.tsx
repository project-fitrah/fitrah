import Link from "next/link";
import type { ReactNode } from "react";
import { Home } from "lucide-react";
import { isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

const NAV_ITEMS: DashboardNavItem[] = [
  { href: "/recordings", label: "Recordings", icon: "recordings" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/scholars", label: "Scholars", icon: "scholars" },
  { href: "/settings", label: "Instellingen", icon: "settings" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const userResult = await supabase.auth.getUser();

  if (userResult.error || !userResult.data.user) {
    redirect("/login");
  }

  if (!isAdminEmail(userResult.data.user.email)) {
    redirect("/login?error=not-admin");
  }

  const userEmail = userResult.data.user.email ?? "Admin user";

  return (
    <div className="relative min-h-dvh bg-[radial-gradient(circle_at_top,#1a2b4f_0%,#0a1223_45%,#050814_100%)] pb-20 md:pb-0">
      <div className="mx-auto grid min-h-dvh w-full max-w-350 gap-4 px-3 py-3 md:grid-cols-[260px_minmax(0,1fr)] md:gap-6 md:px-6 md:py-6">
        <aside className="hidden rounded-3xl border border-(--border) bg-[color-mix(in_oklab,var(--card)_80%,black)] p-4 md:flex md:flex-col">
          <Link href="/recordings" className="rounded-2xl border border-(--border) bg-black/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Fitrah</p>
            <p className="mt-1 text-lg font-semibold text-white">Admin Dashboard</p>
          </Link>

          <DashboardNav items={NAV_ITEMS} className="mt-4" />

          <div className="mt-auto rounded-2xl border border-(--border) bg-black/25 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Ingelogd als</p>
            <p className="mt-1 truncate text-sm text-white">{userEmail}</p>
            <SignOutButton className="mt-3 w-full" />
          </div>
        </aside>

        <div className="flex min-h-full flex-col">
          <header className="rounded-3xl border border-(--border) bg-[color-mix(in_oklab,var(--card)_86%,black)] px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Fitrah Admin</p>
                <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Dashboard</h1>
              </div>
              <Link
                href="/recordings"
                className="inline-flex items-center gap-2 rounded-xl border border-(--border) bg-black/20 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-black/35"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
            </div>
          </header>

          <main className="mt-4 flex-1 rounded-3xl border border-(--border) bg-[color-mix(in_oklab,var(--card)_88%,black)] p-3 md:mt-6 md:p-6">
            {children}
          </main>
        </div>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">
        <DashboardNav items={NAV_ITEMS} mobile />
      </div>
    </div>
  );
}
