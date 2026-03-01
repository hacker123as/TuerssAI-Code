"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FileCode, Flag } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";

type ProfileScript = { id: string; title: string; description: string | null; imageUrl: string | null; madeByAI: boolean; createdAt: string };
type ProfileData = { user: { username: string; profileImageUrl?: string | null; id: string }; scripts: ProfileScript[] };

const ACCOUNT_REPORT_OPTIONS = [
  { value: "inappropriate_image", label: "Inappropriate image" },
  { value: "inappropriate_username", label: "Inappropriate username" },
  { value: "other", label: "Other" },
];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [meRes, profileRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/profile/${encodeURIComponent(username)}`),
      ]);
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      setCurrentUser(meData.user);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    })();
  }, [username, router]);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !reportReason || reportSubmitting) return;
    setReportSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "account",
          targetId: profile.user.id,
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

  if (loading || !profile) {
    return (
      <div className="flex h-screen max-h-screen overflow-hidden bg-[#0d0d0d]">
        <AppSidebar user={currentUser} />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-sand-500">{loading ? "Loading…" : "User not found."}</div>
        </main>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.user.id;

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#0d0d0d] text-sand-100">
      <AppSidebar user={currentUser} />
      <main className="tuerss-scrollbar-hide min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <div className="rounded-2xl border border-white/10 bg-[#141414] p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                {profile.user.profileImageUrl ? (
                  <img src={profile.user.profileImageUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sand-600/50 text-2xl font-bold text-white">
                    {(profile.user.username || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.user.username}</h1>
                  <p className="text-sm text-sand-500">{profile.scripts.length} script{profile.scripts.length !== 1 ? "s" : ""} shared</p>
                </div>
              </div>
              {!isOwnProfile && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setReportOpen(!reportOpen)}
                    className="flex items-center gap-1 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Flag className="h-3.5 w-3.5" /> Report account
                  </button>
                  {reportOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setReportOpen(false)} />
                      <form
                        onSubmit={submitReport}
                        className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-white/10 bg-[#1a1a1a] p-3 shadow-xl"
                      >
                        <p className="mb-2 text-xs font-medium text-sand-400">Report this account</p>
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="mb-2 w-full rounded-lg border border-white/20 bg-[#0d0d0d] px-3 py-2 text-sm text-white"
                          required
                        >
                          <option value="">Select reason</option>
                          {ACCOUNT_REPORT_OPTIONS.map((o) => (
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
              )}
            </div>
          </div>

          <h2 className="mt-8 mb-4 text-lg font-semibold text-white">Shared scripts</h2>
          {profile.scripts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-[#141414] py-12 text-center text-sand-500">
              No scripts shared yet
            </div>
          ) : (
            <ul className="space-y-3">
              {profile.scripts.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/community/${s.id}`}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#141414] p-4 transition hover:border-white/20 hover:bg-[#1a1a1a]"
                  >
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#0d0d0d]">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-sand-600">
                          <FileCode className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">{s.title}</p>
                      {s.description && <p className="truncate text-sm text-sand-500">{s.description}</p>}
                      <p className="mt-1 text-xs text-sand-600">
                        {new Date(s.createdAt).toLocaleDateString()}
                        {s.madeByAI && " · Script made by AI"}
                      </p>
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
