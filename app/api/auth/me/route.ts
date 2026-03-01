import { NextResponse } from "next/server";
import { getUserFromSession, ensureDailyCredits } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  await ensureDailyCredits(user.id);
  const updated = await getUserFromSession();
  return NextResponse.json({
    user: updated
      ? { id: updated.id, email: updated.email, username: updated.username, credits: updated.credits }
      : { id: user.id, email: user.email, username: user.username, credits: user.credits },
  });
}
