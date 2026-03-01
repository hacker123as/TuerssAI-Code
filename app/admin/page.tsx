"use client";

import { useState } from "react";
import Link from "next/link";
import { Key, Copy, Check } from "lucide-react";

export default function AdminKeysPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [amount, setAmount] = useState(5);
  const [credits, setCredits] = useState(20);
  const [plan, setPlan] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

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

  function copyAll() {
    if (generated.length) {
      navigator.clipboard.writeText(generated.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-sand-100">
      <header className="border-b border-white/10 bg-[#141414]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Link href="/" className="text-lg font-bold text-white">
            TuerSS
          </Link>
          <span className="text-sm text-amber-400">Admin — Key generator</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-white">
          <Key className="h-7 w-7 text-sand-500" /> Generate keys
        </h1>
        <p className="mb-6 text-sm text-sand-500">
          Set ADMIN_SECRET in your environment. Users redeem keys in Settings → Redeem key. Keys are one-time use.
        </p>
        <form onSubmit={handleGenerate} className="space-y-4 rounded-2xl border border-white/10 bg-[#141414] p-6">
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
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-white">Generated keys ({generated.length})</h2>
              <button
                type="button"
                onClick={copyAll}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm text-sand-400 hover:bg-white/5 hover:text-white"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy all"}
              </button>
            </div>
            <pre className="max-h-60 overflow-auto rounded-lg bg-[#0d0d0d] p-4 font-mono text-xs text-sand-300 whitespace-pre-wrap break-all">
              {generated.join("\n")}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
