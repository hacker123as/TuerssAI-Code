"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCode, MessageCircle, Bot, User } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";

type Author = { username: string; profileImageUrl?: string | null };
type CommunityScript = {
  id: string;
  title: string;
  description: string | null;
  content: string;
  imageUrl: string | null;
  madeByAI: boolean;
  createdAt: string;
  commentCount: number;
  author: Author;
};

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; credits: number; profileImageUrl?: string | null } | null>(null);
  const [scripts, setScripts] = useState<CommunityScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const loadScripts = useCallback(async () => {
    const res = await fetch("/api/community");
    if (res.ok) {
      const data = await res.json();
      setScripts(data.scripts || []);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [meRes, scriptsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/community"),
      ]);
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);
      if (scriptsRes.ok) {
        const data = await scriptsRes.json();
        setScripts(data.scripts || []);
      }
      setLoading(false);
    })();
  }, [router]);

  async function seedTestScripts() {
    setSeeding(true);
    try {
      const res = await fetch("/api/community/seed", { method: "POST" });
      if (res.ok) await loadScripts();
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen max-h-screen overflow-hidden bg-[#0d0d0d]">
        <AppSidebar user={user} />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-sand-500">Loading…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#0d0d0d] text-sand-100">
      <AppSidebar user={user} />
      <main className="tuerss-scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <h1 className="mb-2 text-2xl font-bold text-white">Community</h1>
          <p className="mb-8 text-sm text-sand-500">Scripts shared by the community. Upload from the script editor.</p>

          {scripts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-white/20 bg-[#141414] p-12 text-center">
              <FileCode className="mx-auto h-12 w-12 text-sand-500" />
              <p className="mt-4 text-sand-300">No scripts shared yet</p>
              <p className="mt-1 text-sm text-sand-500">Create a script, then use &quot;Upload to community&quot; in the editor to share.</p>
              <p className="mt-4 text-xs text-sand-600">Or load 10 sample scripts (uses test account):</p>
              <button
                type="button"
                onClick={seedTestScripts}
                disabled={seeding}
                className="mt-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-sand-400 hover:bg-white/10 disabled:opacity-50"
              >
                {seeding ? "Loading…" : "Load sample scripts"}
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {scripts.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/community/${s.id}`}
                    className="block rounded-2xl border border-white/10 bg-[#141414] transition hover:border-white/20 hover:bg-[#1a1a1a]"
                  >
                    <div className="flex gap-4 p-5">
                      <div className="shrink-0">
                        {s.author.profileImageUrl ? (
                          <img src={s.author.profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sand-600/50 text-sm font-medium text-white">
                            {(s.author.username || "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-white">{s.author.username}</span>
                          <span className="text-xs text-sand-500">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                          {s.madeByAI ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                              <Bot className="h-3 w-3" /> Script made by AI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sand-600/30 px-2 py-0.5 text-[10px] text-sand-400">
                              <User className="h-3 w-3" /> Made by user
                            </span>
                          )}
                        </div>
                        <h2 className="mt-1 font-semibold text-white">{s.title}</h2>
                        {s.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-sand-400">{s.description}</p>
                        )}
                        <div className="mt-3 flex items-center gap-3 text-xs text-sand-500">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" /> {s.commentCount} comment{s.commentCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#0d0d0d]">
                        {s.imageUrl ? (
                          <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-sand-600">No image</div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
