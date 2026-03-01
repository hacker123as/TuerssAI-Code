import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const updates: { theme?: string; aiLanguage?: string; profileImageUrl?: string | null } = {};
  if (typeof body.theme === "string" && ["dark", "light", "system"].includes(body.theme)) {
    updates.theme = body.theme;
  }
  if (typeof body.aiLanguage === "string" && body.aiLanguage.length <= 10) {
    updates.aiLanguage = body.aiLanguage;
  }
  // Profile image: accept data URL (e.g. from canvas/file) or clear with null
  if (body.profileImageUrl === null || body.profileImageUrl === "") {
    updates.profileImageUrl = null;
  } else if (typeof body.profileImageUrl === "string" && body.profileImageUrl.startsWith("data:image/")) {
    // Limit size for MongoDB (e.g. 500KB)
    if (body.profileImageUrl.length < 500 * 1024) {
      updates.profileImageUrl = body.profileImageUrl;
    }
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }
  await prisma.user.update({
    where: { id: session.id },
    data: updates,
  });
  return NextResponse.json({ ok: true });
}
