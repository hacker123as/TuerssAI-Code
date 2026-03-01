"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleBypass() {
    setError("");
    setBypassLoading(true);
    try {
      const res = await fetch("/api/auth/bypass", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || "Bypass failed");
        setError(msg);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Bypass failed. Check console or try again.");
    } finally {
      setBypassLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <div className="animate-scale-in w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-8 shadow-2xl shadow-black/40">
        <Link href="/" className="mb-6 inline-block text-xl font-bold text-white transition hover:opacity-90">
          TuerSS
        </Link>
        <h1 className="text-2xl font-bold text-white">Sign up</h1>
        <p className="mt-1 text-sand-500">No code, no problem. 20 free generations.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="animate-fade-in rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-sand-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#0d0d0d] px-4 py-3 text-white placeholder:text-sand-500 transition-all duration-200 focus:border-sand-500 focus:outline-none focus:ring-2 focus:ring-sand-500/20"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-sand-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#0d0d0d] px-4 py-3 text-white placeholder:text-sand-500 transition-all duration-200 focus:border-sand-500 focus:outline-none focus:ring-2 focus:ring-sand-500/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-sand-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#0d0d0d] px-4 py-3 text-white placeholder:text-sand-500 transition-all duration-200 focus:border-sand-500 focus:outline-none focus:ring-2 focus:ring-sand-500/20"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-sand-300">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-white/20 bg-[#0d0d0d] px-4 py-3 text-white placeholder:text-sand-500 transition-all duration-200 focus:border-sand-500 focus:outline-none focus:ring-2 focus:ring-sand-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-shine w-full rounded-xl bg-gradient-to-r from-sand-500 to-sand-600 py-3 font-semibold text-white shadow-lg shadow-sand-500/20 transition-all duration-200 hover:from-sand-400 hover:to-sand-500 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <div className="mt-5 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={handleBypass}
            disabled={bypassLoading}
            className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-300 transition-all duration-200 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {bypassLoading ? "…" : "Bypass (test account)"}
          </button>
          <p className="mt-1 text-center text-xs text-sand-500">
            Use test account for quick testing
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-sand-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-sand-300 underline hover:text-white">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
