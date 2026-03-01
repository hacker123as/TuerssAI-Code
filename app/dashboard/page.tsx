"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCode, Plus, LogOut, Zap } from "lucide-react";

type User = { id: string; email: string; username: string; credits: number } | null;
type Script = { id: string; title: string; content: string; createdAt: string; updatedAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      const [meRes, scriptsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/scripts"),
      ]);
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);
      if (scriptsRes.ok) {
        const scriptsData = await scriptsRes.json();
        setScripts(scriptsData.scripts || []);
      }
      setLoading(false);
    })();
  }, [router]);

  async function createScript() {
    setCreating(true);
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Script" }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const script = await res.json();
      router.push(`/script/${script.id}`);
    } catch {
      setCreating(false);
    } finally {
      setCreating(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-100">
        <div className="text-sand-600">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-100">
      <header className="border-b border-sand-300/60 bg-sand-50/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" className="text-lg font-bold text-sand-800">
            TuerSS
          </Link>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 rounded-full bg-sand-200 px-3 py-1 text-sm font-medium text-sand-800">
              <Zap className="h-4 w-4 text-sand-600" />
              {user?.credits ?? 0} generations
            </span>
            <span className="text-sm text-sand-600">{user?.username}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-sand-600 hover:bg-sand-200"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-sand-900">My Scripts</h1>
          <button
            onClick={createScript}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-sand-500 px-5 py-2.5 font-medium text-white hover:bg-sand-600 disabled:opacity-50"
          >
            <Plus className="h-5 w-5" /> New script
          </button>
        </div>

        {scripts.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50/50 p-12 text-center">
            <FileCode className="mx-auto h-12 w-12 text-sand-400" />
            <p className="mt-4 text-sand-600">No scripts yet</p>
            <p className="mt-1 text-sm text-sand-500">
              Create a script and describe what you want. TuerAi will write the Lua for you.
            </p>
            <button
              onClick={createScript}
              disabled={creating}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sand-500 px-5 py-2.5 font-medium text-white hover:bg-sand-600 disabled:opacity-50"
            >
              <Plus className="h-5 w-5" /> Create your first script
            </button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {scripts.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/script/${s.id}`}
                  className="block rounded-xl border border-sand-300 bg-sand-50 p-4 transition hover:border-sand-400 hover:bg-sand-100/80"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-sand-500" />
                    <span className="font-medium text-sand-900">{s.title}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-sand-500">
                    {s.content ? `${s.content.slice(0, 60)}…` : "Empty script"}
                  </p>
                  <p className="mt-2 text-xs text-sand-400">
                    Updated {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
