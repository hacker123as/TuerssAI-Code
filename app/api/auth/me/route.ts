import { NextResponse } from "next/server";
import { getUserFromSession, ensureDailyCredits } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  await ensureDailyCredits(user.id);
  const updated = await getUserFromSession();
  const u = updated || user;
  return NextResponse.json({
    user: u
      ? { id: u.id, email: u.email, username: u.username, credits: u.credits, profileImageUrl: u.profileImageUrl ?? null, theme: u.theme ?? null, aiLanguage: u.aiLanguage ?? null, plan: u.plan ?? null, role: u.role ?? "user" }
      : null,
  });
}
