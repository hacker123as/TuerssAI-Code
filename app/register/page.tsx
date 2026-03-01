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
        setError(data.error || "Bypass failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Bypass failed");
    } finally {
      setBypassLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sand-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-sand-300 bg-sand-50 p-8 shadow-lg">
        <Link href="/" className="mb-6 inline-block text-xl font-bold text-sand-800">
          TuerSS
        </Link>
        <h1 className="text-2xl font-bold text-sand-900">Sign up</h1>
        <p className="mt-1 text-sand-600">No code, no problem. 20 free generations.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-100 px-4 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-sand-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-sand-300 bg-white px-4 py-2 text-sand-900 focus:border-sand-500 focus:outline-none focus:ring-1 focus:ring-sand-500"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-sand-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-sand-300 bg-white px-4 py-2 text-sand-900 focus:border-sand-500 focus:outline-none focus:ring-1 focus:ring-sand-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-sand-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-sand-300 bg-white px-4 py-2 text-sand-900 focus:border-sand-500 focus:outline-none focus:ring-1 focus:ring-sand-500"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-sand-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-sand-300 bg-white px-4 py-2 text-sand-900 focus:border-sand-500 focus:outline-none focus:ring-1 focus:ring-sand-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sand-500 py-2.5 font-medium text-white hover:bg-sand-600 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <div className="mt-4 border-t border-sand-200 pt-4">
          <button
            type="button"
            onClick={handleBypass}
            disabled={bypassLoading}
            className="w-full rounded-lg border border-amber-400 bg-amber-50 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
          >
            {bypassLoading ? "…" : "Bypass (test account)"}
          </button>
          <p className="mt-1 text-center text-xs text-sand-500">
            Use test account for quick testing
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-sand-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-sand-600 underline hover:text-sand-800">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
