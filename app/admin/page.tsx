"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Key, Copy, Check, Shield, Flag, FileCheck } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";

type Report = { id: string; targetType: string; targetId: string; reason: string; details: string | null; status: string; createdAt: string };
type ScriptRow = { id: string; title: string; author: { username: string; role?: string }; verified: boolean; createdAt: string };

export default function AdminPage() {
  const [user, setUser] = useState<{ id: string; username: string; role?: string } | null>(null);
  const [adminSecret, setAdminSecret] = useState("");
  const [amount, setAmount] = useState(5);
  const [credits, setCredits] = useState(20);
  const [plan, setPlan] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [scripts, setScripts] = useState<ScriptRow[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
      if (data.user?.role === "admin") {
        const [reportsRes, scriptsRes] = await Promise.all([
          fetch("/api/admin/reports"),
          fetch("/api/admin/scripts?verified=false"),
        ]);
        if (reportsRes.ok) {
          const r = await reportsRes.json();
          setReports(r.reports || []);
        }
        if (scriptsRes.ok) {
          const s = await scriptsRes.json();
          setScripts(s.scripts || []);
        }
      }
    })();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGenerated([]);
    if (!adminSecret.trim()) {
      setError("Enter admin secret.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/keys/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret.trim(),
        },
        body: JSON.stringify({
          amount,
          credits,
          plan: plan.trim() || undefined,
          expiresInDays: typeof expiresInDays === "number" ? expiresInDays : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate keys");
        return;
      }
      setGenerated(data.codes || []);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeedAdmin() {
    if (!adminSecret.trim()) {
      setSeedMessage("Enter admin secret first.");
      return;
    }
    setSeedLoading(true);
    setSeedMessage("");
    try {
      const res = await fetch("/api/admin/seed-admin", {
        method: "POST",
        headers: { "x-admin-secret": adminSecret.trim() },
      });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage(data.message || "Done.");
      } else {
        setSeedMessage(data.error || data.detail || "Failed");
      }
    } catch {
      setSeedMessage("Request failed");
    } finally {
      setSeedLoading(false);
    }
  }

  async function verifyScript(id: string) {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/community/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true }),
      });
      if (res.ok) {
        setScripts((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setVerifyingId(null);
    }
  }

  function copyAll() {
    if (generated.length) {
      navigator.clipboard.writeText(generated.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#0d0d0d] text-sand-100">
      <AppSidebar user={user} />
      <main className="tuerss-scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-white">
            <Shield className="h-7 w-7 text-amber-400" /> Admin
          </h1>
          <p className="mb-6 text-sm text-sand-500">
            Generate keys and manage content. Use ADMIN_SECRET for key generation and seed admin.
          </p>

          <section className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Key className="h-5 w-5 text-sand-500" /> Generate keys
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sand-400">Admin secret</label>
                <input
                  type="password"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="ADMIN_SECRET"
                  className="mt-1 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-4 py-2 font-mono text-sm text-white placeholder:text-sand-600 focus:border-sand-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-400">Amount</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value, 10) || 1)}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-4 py-2 text-white focus:border-sand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-400">Credits per key</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={credits}
                    onChange={(e) => setCredits(parseInt(e.target.value, 10) || 20)}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-4 py-2 text-white focus:border-sand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sand-400">Plan (optional)</label>
                  <input
                    type="text"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="e.g. pro, monthly"
                    className="mt-1 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-4 py-2 text-white placeholder:text-sand-600 focus:border-sand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-sand-400">Expires in days (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                    placeholder="Leave empty for no expiry"
                    className="mt-1 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-4 py-2 text-white placeholder:text-sand-600 focus:border-sand-500 focus:outline-none"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-sand-500 py-2.5 font-medium text-white hover:bg-sand-400 disabled:opacity-50"
              >
                {loading ? "Generating…" : "Generate keys"}
              </button>
            </form>
            {generated.length > 0 && (
              <div className="mt-6 rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-sand-400">Generated keys ({generated.length})</span>
                  <button
                    type="button"
                    onClick={copyAll}
                    className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-sand-400 hover:bg-white/5 hover:text-white"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy all"}
                  </button>
                </div>
                <pre className="max-h-40 overflow-auto font-mono text-xs text-sand-300 whitespace-pre-wrap break-all">
                  {generated.join("\n")}
                </pre>
              </div>
            )}
          </section>

          <section className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
            <h2 className="mb-2 text-lg font-semibold text-white">Seed admin user</h2>
            <p className="mb-4 text-sm text-sand-500">
              Creates or updates admin user lilami@tuerss.com and removes the old test account. Requires admin secret above.
            </p>
            <button
              type="button"
              onClick={handleSeedAdmin}
              disabled={seedLoading || !adminSecret.trim()}
              className="rounded-lg bg-amber-600 py-2.5 px-4 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              {seedLoading ? "…" : "Seed admin"}
            </button>
            {seedMessage && <p className="mt-2 text-sm text-sand-400">{seedMessage}</p>}
          </section>

          {isAdmin && (
            <>
              <section className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Flag className="h-5 w-5 text-red-400" /> Reports
                </h2>
                {reports.length === 0 ? (
                  <p className="text-sm text-sand-500">No reports.</p>
                ) : (
                  <ul className="space-y-3">
                    {reports.map((r) => (
                      <li key={r.id} className="rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-medium text-white">{r.targetType}</span>
                          <span className="text-sand-500">{r.reason}</span>
                          <span className="text-sand-600">{r.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-sand-500">ID: {r.targetId}</p>
                        {r.details && <p className="mt-1 text-sm text-sand-400">{r.details}</p>}
                        <p className="mt-1 text-xs text-sand-600">{new Date(r.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <FileCheck className="h-5 w-5 text-emerald-400" /> Verify scripts (unverified)
                </h2>
                {scripts.length === 0 ? (
                  <p className="text-sm text-sand-500">No unverified scripts.</p>
                ) : (
                  <ul className="space-y-3">
                    {scripts.map((s) => (
                      <li key={s.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                        <div>
                          <Link href={`/community/${s.id}`} className="font-medium text-white hover:underline">
                            {s.title}
                          </Link>
                          <p className="text-xs text-sand-500">by {s.author.username}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => verifyScript(s.id)}
                          disabled={verifyingId === s.id}
                          className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
                        >
                          {verifyingId === s.id ? "…" : "Verify safe"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
