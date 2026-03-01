"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileCode, MessageCircle, Bot, User, Search, Eye, TrendingUp, Clock, Sparkles } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";

type Author = { username: string; profileImageUrl?: string | null };
type CommunityScript = {
  id: string;
  title: string;
  description: string | null;
  content: string;
  imageUrl: string | null;
  madeByAI: boolean;
  views: number;
  createdAt: string;
  commentCount: number;
  author: Author;
};

function ScriptCard({ s }: { s: CommunityScript }) {
  return (
    <Link
      href={`/community/${s.id}`}
      className="hover-lift block rounded-xl border border-white/10 bg-[#141414]"
    >
      <div className="flex gap-4 p-4">
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
            <span className="text-xs text-sand-500">{new Date(s.createdAt).toLocaleDateString()}</span>
            {s.madeByAI ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <Bot className="h-3 w-3" /> AI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand-600/30 px-2 py-0.5 text-[10px] text-sand-400">
                <User className="h-3 w-3" /> User
              </span>
            )}
          </div>
          <h2 className="mt-1 font-semibold text-white">{s.title}</h2>
          {s.description && <p className="mt-1 line-clamp-2 text-sm text-sand-400">{s.description}</p>}
          <div className="mt-2 flex items-center gap-4 text-xs text-sand-500">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {s.views} view{s.views !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {s.commentCount} comment{s.commentCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#0d0d0d]">
          {s.imageUrl ? (
            <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-sand-600">No image</div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; credits?: number; profileImageUrl?: string | null } | null>(null);
  const [scripts, setScripts] = useState<CommunityScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  useEffect(() => {
    if (loading || scripts.length > 0) return;
    (async () => {
      setSeeding(true);
      try {
        const res = await fetch("/api/community/seed", { method: "POST" });
        if (res.ok) await loadScripts();
      } finally {
        setSeeding(false);
      }
    })();
  }, [loading, scripts.length, loadScripts]);

  const searchLower = search.trim().toLowerCase();
  const bySearch = searchLower
    ? scripts.filter(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          (s.description || "").toLowerCase().includes(searchLower) ||
          s.author.username.toLowerCase().includes(searchLower)
      )
    : scripts;

  const popular = [...bySearch].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  const latest = [...bySearch].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const madeWithAI = bySearch.filter((s) => s.madeByAI);

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
        <div className="mx-auto max-w-4xl px-5 py-8">
          <h1 className="mb-2 text-2xl font-bold text-white">Community</h1>
          <p className="mb-6 text-sm text-sand-500">Scripts shared by the community. Most viewed rise to the top.</p>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-500" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search scripts, authors..."
                className="w-full rounded-xl border border-white/20 bg-[#141414] py-2.5 pl-10 pr-4 text-white placeholder:text-sand-500 focus:border-sand-500 focus:outline-none"
              />
            </div>
          </div>

          {seeding ? (
            <div className="rounded-2xl border border-white/10 bg-[#141414] p-12 text-center text-sand-500">
              Loading sample scripts…
            </div>
          ) : bySearch.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-white/20 bg-[#141414] p-12 text-center">
              <FileCode className="mx-auto h-12 w-12 text-sand-500" />
              <p className="mt-4 text-sand-300">No scripts found</p>
              <p className="mt-1 text-sm text-sand-500">
                {search ? "Try a different search." : "Create a script and use &quot;Upload to community&quot; in the editor to share."}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Popular — most views at top */}
              <section className="animate-fade-in-up rounded-2xl border border-white/10 bg-[#141414]/90 p-6 shadow-xl shadow-black/20">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <TrendingUp className="h-5 w-5 text-amber-400" /> Popular
                </h2>
                <p className="mb-4 text-sm text-sand-500">Most viewed scripts. Views update when someone opens a script.</p>
                <ul className="space-y-3">
                  {popular.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <ScriptCard s={s} />
                    </li>
                  ))}
                </ul>
              </section>

              {/* Latest */}
              <section className="animate-fade-in-up stagger-1 rounded-2xl border border-white/10 bg-[#141414]/90 p-6 opacity-0 shadow-xl shadow-black/20 [animation-fill-mode:forwards]">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Clock className="h-5 w-5 text-sand-400" /> Latest
                </h2>
                <p className="mb-4 text-sm text-sand-500">Newest shared scripts.</p>
                <ul className="space-y-3">
                  {latest.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <ScriptCard s={s} />
                    </li>
                  ))}
                </ul>
              </section>

              {/* Made with AI */}
              <section className="animate-fade-in-up stagger-2 rounded-2xl border border-white/10 bg-[#141414]/90 p-6 opacity-0 shadow-xl shadow-black/20 [animation-fill-mode:forwards]">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <Sparkles className="h-5 w-5 text-emerald-400" /> Made with AI
                </h2>
                <p className="mb-4 text-sm text-sand-500">Scripts created with TuerAi.</p>
                {madeWithAI.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/20 py-8 text-center text-sm text-sand-500">No AI scripts yet</p>
                ) : (
                  <ul className="space-y-3">
                    {madeWithAI.slice(0, 6).map((s) => (
                      <li key={s.id}>
                        <ScriptCard s={s} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
