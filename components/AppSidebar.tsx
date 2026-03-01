"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, LogOut, Settings, Users, LayoutDashboard, Shield } from "lucide-react";

type User = {
  id: string;
  email?: string;
  username: string;
  credits?: number;
  profileImageUrl?: string | null;
  theme?: string | null;
  aiLanguage?: string | null;
  plan?: string | null;
  role?: string;
} | null;

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/community", label: "Community", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-white/10 bg-[#121212]">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white transition hover:opacity-90">
          <span className="text-lg">TuerSS</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {user && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-colors">
            {user.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand-600/50 text-sm font-medium text-white">
                {(user.username || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.username}</p>
              <p className="flex items-center gap-1 text-xs text-sand-500">
                <Zap className="h-3 w-3 text-amber-400" />
                {user.credits ?? 0} generations
              </p>
              {user.plan && user.plan !== "free" && (
                <p className="text-[10px] uppercase tracking-wider text-sand-500">{user.plan}</p>
              )}
            </div>
          </div>
        )}
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive ? "bg-sand-500/20 text-white" : "text-sand-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-sand-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </aside>
  );
}
