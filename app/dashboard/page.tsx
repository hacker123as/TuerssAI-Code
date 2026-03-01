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
      <div className="flex min-h-screen bg-[#0d0d0d]">
        <AppSidebar user={user} />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-sand-500">Loading…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d0d0d] text-sand-100">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-auto">
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
                className="flex items-center gap-2 rounded-xl bg-sand-500 px-5 py-2.5 font-medium text-white hover:bg-sand-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-5 w-5" /> New script
              </button>
            </div>
          </div>
          {!canCreate && createDisabledReason && (
            <p className="mb-4 text-sm text-sand-500">{createDisabledReason}</p>
          )}

          {scripts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-white/20 bg-[#141414] p-12 text-center">
              <FileCode className="mx-auto h-12 w-12 text-sand-500" />
              <p className="mt-4 text-sand-300">No scripts yet</p>
              <p className="mt-1 text-sm text-sand-500">
                Create a script and describe what you want. TuerAi will write the Lua for you. Chat is saved automatically.
              </p>
              <button
                onClick={createScript}
                disabled={!canCreate}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sand-500 px-5 py-2.5 font-medium text-white hover:bg-sand-400 disabled:opacity-50"
              >
                <Plus className="h-5 w-5" /> Create your first script
              </button>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {scripts.map((s) => (
                <li key={s.id} className="group relative">
                  <Link
                    href={`/script/${s.id}`}
                    className="block rounded-xl border border-white/10 bg-[#141414] p-4 pr-10 transition hover:border-white/20 hover:bg-[#1a1a1a]"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 shrink-0 text-sand-500" />
                      <span className="font-medium text-white">{s.title}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-sand-500">
                      {s.content ? `${s.content.slice(0, 60)}…` : "Empty script"}
                    </p>
                    <p className="mt-2 text-xs text-sand-600">
                      Updated {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setDeleteConfirm(s); }}
                    className="absolute right-3 top-4 rounded-lg p-1.5 text-sand-500 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-xl"
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
                className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-sand-300 hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteScript(deleteConfirm)}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
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
