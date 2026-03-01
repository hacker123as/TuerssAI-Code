"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings as SettingsIcon, Key, Palette, Languages, User } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";

type UserType = {
  id: string;
  username: string;
  credits: number;
  profileImageUrl?: string | null;
  theme?: string | null;
  aiLanguage?: string | null;
  plan?: string | null;
} | null;

const AI_LANGUAGES = [
  { value: "", label: "English (default)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<string>("dark");
  const [aiLanguage, setAiLanguage] = useState<string>("");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setTheme(data.user?.theme || "dark");
      setAiLanguage(data.user?.aiLanguage || "");
      setLoading(false);
    })();
  }, [router]);

  async function savePreferences(nextTheme?: string, nextLang?: string) {
    const t = nextTheme ?? theme;
    const l = nextLang ?? aiLanguage;
    setProfileSaving(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t, aiLanguage: l || null }),
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    setRedeemMessage(null);
    setRedeemLoading(true);
    try {
      const res = await fetch("/api/auth/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRedeemMessage({ type: "error", text: data.error || "Redeem failed" });
        return;
      }
      setRedeemMessage({ type: "success", text: `Key redeemed! +${data.creditsAdded} generations${data.plan ? `, plan: ${data.plan}` : ""}.` });
      setRedeemCode("");
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }
    } catch {
      setRedeemMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setRedeemLoading(false);
    }
  }

  async function handleProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setProfileSaving(true);
      try {
        await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileImageUrl: dataUrl }),
        });
        setUser((u) => (u ? { ...u, profileImageUrl: dataUrl } : null));
      } finally {
        setProfileSaving(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

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
        <div className="mx-auto max-w-2xl px-5 py-8">
          <h1 className="mb-8 flex items-center gap-2 text-2xl font-bold text-white">
            <SettingsIcon className="h-7 w-7 text-sand-500" /> Settings
          </h1>

          {/* Profile picture */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <User className="h-5 w-5 text-sand-500" /> Profile
            </h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={profileSaving}
                className="relative shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-white/5 hover:border-sand-500/50"
              >
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="h-20 w-20 object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center text-2xl font-bold text-sand-500">
                    {(user?.username || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-medium text-white opacity-0 transition hover:opacity-100">
                  Change
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
              <div>
                <p className="text-sm text-white">Profile picture</p>
                <p className="text-xs text-sand-500">Click to upload. Shown in the sidebar.</p>
              </div>
            </div>
          </section>

          {/* Theme */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Palette className="h-5 w-5 text-sand-500" /> Appearance
            </h2>
            <div className="flex gap-4">
              {(["dark", "light", "system"] as const).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="theme"
                    checked={theme === t}
                    onChange={() => { setTheme(t); savePreferences(t, undefined); }}
                    className="rounded-full border-white/20 text-sand-500 focus:ring-sand-500"
                  />
                  <span className="capitalize text-sand-300">{t}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-sand-500">Site theme. (Full theme switching can be wired later.)</p>
          </section>

          {/* AI language */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Languages className="h-5 w-5 text-sand-500" /> AI language
            </h2>
            <p className="mb-3 text-sm text-sand-400">Preferred language for TuerAi replies (e.g. chat and code comments).</p>
            <select
              value={aiLanguage}
              onChange={(e) => { const v = e.target.value; setAiLanguage(v); savePreferences(theme, v); }}
              className="w-full max-w-xs rounded-lg border border-white/20 bg-[#0d0d0d] px-4 py-2 text-white focus:border-sand-500 focus:outline-none"
            >
              {AI_LANGUAGES.map((opt) => (
                <option key={opt.value || "en"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          {/* Redeem key */}
          <section className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Key className="h-5 w-5 text-sand-500" /> Redeem key
            </h2>
            <p className="mb-3 text-sm text-sand-400">Enter a key from your purchase to add generations or activate a plan.</p>
            <form onSubmit={handleRedeem} className="flex gap-2">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="TUER-XXXXXXXX"
                className="flex-1 rounded-lg border border-white/20 bg-[#0d0d0d] px-4 py-2 font-mono text-white placeholder:text-sand-600 focus:border-sand-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={redeemLoading || !redeemCode.trim()}
                className="rounded-lg bg-sand-500 px-4 py-2 font-medium text-white hover:bg-sand-400 disabled:opacity-50"
              >
                {redeemLoading ? "Redeeming…" : "Redeem"}
              </button>
            </form>
            {redeemMessage && (
              <p className={`mt-2 text-sm ${redeemMessage.type === "success" ? "text-green-400" : "text-red-400"}`}>
                {redeemMessage.text}
              </p>
            )}
          </section>

          <p className="text-sm text-sand-500">
            <a href="/privacy" className="underline hover:text-sand-400">Privacy policy</a>
            {" · "}
            <a href="/terms" className="underline hover:text-sand-400">Terms of service</a>
          </p>
        </div>
      </main>
    </div>
  );
}
