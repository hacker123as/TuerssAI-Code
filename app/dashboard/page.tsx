"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCode, Plus, Trash2, Zap } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";

const MAX_SCRIPTS = 6;

type User = { id: string; email: string; username: string; credits: number; profileImageUrl?: string | null } | null;
type Script = { id: string; title: string; content: string; createdAt: string; updatedAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Script | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [router]);

  async function createScript() {
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Script" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create script");
        return;
      }
      router.push(`/script/${data.id}`);
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function deleteScript(script: Script) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setDeleteConfirm(null);
      await loadData();
    } catch {
      setCreateError("Could not delete script");
    } finally {
      setDeleting(false);
    }
  }

  const atScriptLimit = scripts.length >= MAX_SCRIPTS;
  const noCredits = (user?.credits ?? 0) < 1;
  const canCreate = !atScriptLimit && !noCredits && !creating;
  const createDisabledReason = atScriptLimit
    ? "Delete a script to create a new one (max 6)."
    : noCredits
    ? "You need at least 1 generation to create a script. Redeem a key or wait for daily credits."
    : "";

  if (loading) {
    return (
      <div className="flex h-screen max-h-screen overflow-hidden bg-[#0a0a0a]">
        <AppSidebar user={user} />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand-600 border-t-sand-400" />
            <span className="text-sm text-sand-500">Loading…</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#0a0a0a] text-sand-100">
      <AppSidebar user={user} />
      <main className="tuerss-scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">My Scripts</h1>
            <div className="flex flex-col items-end gap-1">
              {createError && (
                <p className="text-sm text-red-400">{createError}</p>
              )}
              <button
                onClick={createScript}
                disabled={!canCreate}
                title={createDisabledReason || "Create new script"}
                className="btn-shine flex items-center gap-2 rounded-xl bg-gradient-to-r from-sand-500 to-sand-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-sand-500/20 transition-all duration-200 hover:scale-[1.02] hover:from-sand-400 hover:to-sand-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <Plus className="h-5 w-5" /> New script
              </button>
            </div>
          </div>
          {!canCreate && createDisabledReason && (
            <p className="mb-4 text-sm text-sand-500">{createDisabledReason}</p>
          )}

          {scripts.length === 0 ? (
            <div className="animate-fade-in-up rounded-2xl border-2 border-dashed border-white/20 bg-[#141414] p-12 text-center">
              <FileCode className="mx-auto h-14 w-14 text-sand-500" />
              <p className="mt-4 text-lg font-medium text-sand-300">No scripts yet</p>
              <p className="mt-1 text-sm text-sand-500">
                Create a script and describe what you want. TuerAi will write the Lua for you. Chat is saved automatically.
              </p>
              <button
                onClick={createScript}
                disabled={!canCreate}
                className="btn-shine mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sand-500 to-sand-600 px-5 py-2.5 font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50"
              >
                <Plus className="h-5 w-5" /> Create your first script
              </button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {scripts.map((s, i) => (
                <li key={s.id} className="group relative animate-fade-in-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: `${i * 0.05}s` }}>
                  <Link
                    href={`/script/${s.id}`}
                    className="hover-lift block rounded-xl border border-white/10 bg-[#141414] p-5 pr-12"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 shrink-0 text-sand-500" />
                      <span className="font-medium text-white">{s.title}</span>
                    </div>
                    <p className="mt-2 truncate text-sm text-sand-500">
                      {s.content ? `${s.content.slice(0, 60)}…` : "Empty script"}
                    </p>
                    <p className="mt-2 text-xs text-sand-600">
                      Updated {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setDeleteConfirm(s); }}
                    className="absolute right-3 top-5 rounded-lg p-2 text-sand-500 opacity-0 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                    title="Delete script"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div
            className="animate-scale-in w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Delete script?</h3>
            <p className="mt-2 text-sand-400">
              Are you sure you would like to delete <strong className="text-white">&quot;{deleteConfirm.title}&quot;</strong>? If you delete it, it will not be recoverable. No credits are refunded.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !deleting && setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-sand-300 transition-all hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteScript(deleteConfirm)}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
