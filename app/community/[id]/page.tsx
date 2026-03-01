"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Bot, User, Flag, Send } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatCodeBlock } from "@/components/ChatCodeBlock";

type Author = { username: string; profileImageUrl?: string | null };
type Comment = { id: string; content: string; createdAt: string; author: Author };
type ScriptDetail = {
  id: string;
  title: string;
  description: string | null;
  content: string;
  imageUrl: string | null;
  madeByAI: boolean;
  createdAt: string;
  author: Author;
  comments: Comment[];
};

const SCRIPT_REPORT_OPTIONS = [
  { value: "inappropriate_script", label: "Inappropriate script" },
  { value: "malicious_script", label: "Malicious script" },
  { value: "inappropriate_images", label: "Inappropriate images" },
  { value: "other", label: "Other" },
];

export default function CommunityScriptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [script, setScript] = useState<ScriptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [meRes, scriptRes] = await Promise.all([
      fetch("/api/auth/me"),
      fetch(`/api/community/${id}`),
    ]);
    if (!meRes.ok) {
      router.push("/login");
      return;
    }
    const meData = await meRes.json();
    setUser(meData.user);
    if (scriptRes.ok) {
      const data = await scriptRes.json();
      setScript(data);
    } else {
      setScript(null);
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/community/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });
      if (res.ok) {
        setComment("");
        await load();
      }
    } finally {
      setSubmittingComment(false);
    }
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportReason || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "script",
          targetId: id,
          reason: reportReason,
          details: reportReason === "other" ? reportDetails : undefined,
        }),
      });
      if (res.ok) {
        setReportOpen(false);
        setReportReason("");
        setReportDetails("");
      }
    } finally {
      setReportSubmitting(false);
    }
  }

  if (loading || !script) {
    return (
      <div className="flex h-screen max-h-screen overflow-hidden bg-[#0d0d0d]">
        <AppSidebar user={user} />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-sand-500">{loading ? "Loading…" : "Script not found."}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#0d0d0d] text-sand-100">
      <AppSidebar user={user} />
      <main className="tuerss-scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <Link
            href="/community"
            className="mb-6 inline-flex items-center gap-2 text-sm text-sand-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Community
          </Link>

          <article className="rounded-2xl border border-white/10 bg-[#141414] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <Link href={`/profile/${script.author.username}`} className="shrink-0">
                  {script.author.profileImageUrl ? (
                    <img src={script.author.profileImageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-600/50 text-lg font-medium text-white">
                      {(script.author.username || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div>
                  <Link href={`/profile/${script.author.username}`} className="font-semibold text-white hover:underline">
                    {script.author.username}
                  </Link>
                  <p className="text-xs text-sand-500">{new Date(script.createdAt).toLocaleString()}</p>
                  {script.madeByAI ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <Bot className="h-3 w-3" /> Script made by AI
                    </span>
                  ) : (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sand-600/30 px-2 py-0.5 text-[10px] text-sand-400">
                      <User className="h-3 w-3" /> Made by user
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setReportOpen(!reportOpen)}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-sand-500 hover:bg-white/10 hover:text-red-400"
                >
                  <Flag className="h-3.5 w-3.5" /> Report
                </button>
                {reportOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setReportOpen(false)} />
                    <form
                      onSubmit={submitReport}
                      className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-white/10 bg-[#1a1a1a] p-3 shadow-xl"
                    >
                      <p className="mb-2 text-xs font-medium text-sand-400">Report this script</p>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="mb-2 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-3 py-2 text-sm text-white"
                        required
                      >
                        <option value="">Select reason</option>
                        {SCRIPT_REPORT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {reportReason === "other" && (
                        <textarea
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          placeholder="Please describe..."
                          rows={2}
                          className="mb-2 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-3 py-2 text-sm text-white placeholder:text-sand-600"
                        />
                      )}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setReportOpen(false)} className="flex-1 rounded-lg border border-white/20 py-1.5 text-xs text-sand-400">
                          Cancel
                        </button>
                        <button type="submit" disabled={reportSubmitting} className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs text-white disabled:opacity-50">
                          Submit
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>

            <h1 className="mt-4 text-xl font-bold text-white">{script.title}</h1>
            {script.description && <p className="mt-2 text-sm text-sand-400">{script.description}</p>}

            {script.imageUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                <img src={script.imageUrl} alt="" className="max-h-80 w-full object-contain bg-[#0d0d0d]" />
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-white/20 bg-[#0d0d0d] py-8 text-center text-sm text-sand-600">
                No image available
              </div>
            )}

            <div className="mt-4 rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-sand-500">Script</p>
              <ChatCodeBlock code={script.content || "-- empty --"} />
            </div>
          </article>

          <section className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <MessageCircle className="h-5 w-5 text-sand-500" /> Comments ({script.comments.length})
            </h2>
            {user && (
              <form onSubmit={submitComment} className="mb-6 flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 rounded-xl border border-white/20 bg-[#141414] px-4 py-2.5 text-sm text-white placeholder:text-sand-500 focus:border-sand-500 focus:outline-none"
                />
                <button type="submit" disabled={submittingComment || !comment.trim()} className="rounded-xl bg-sand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sand-400 disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
            <ul className="space-y-4">
              {script.comments.map((c) => (
                <li key={c.id} className="flex gap-3 rounded-xl border border-white/10 bg-[#141414] p-4">
                  {c.author.profileImageUrl ? (
                    <img src={c.author.profileImageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand-600/50 text-xs font-medium text-white">
                      {(c.author.username || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <Link href={`/profile/${c.author.username}`} className="text-sm font-medium text-white hover:underline">
                      {c.author.username}
                    </Link>
                    <p className="text-xs text-sand-500">{new Date(c.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-sm text-sand-200">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
