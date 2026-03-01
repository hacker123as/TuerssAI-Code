import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getUserFromSession();
  if (!user || (user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const verifiedParam = searchParams.get("verified");
  const scripts = await prisma.communityScript.findMany({
    where: verifiedParam === "false" ? { verified: false } : undefined,
    orderBy: [{ verified: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { comments: true },
  });
  const userIds = Array.from(new Set(scripts.map((s) => s.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, profileImageUrl: true, role: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const list = scripts.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    content: s.content,
    imageUrl: s.imageUrl,
    madeByAI: s.madeByAI,
    views: s.views,
    verified: s.verified ?? false,
    verifiedAt: s.verifiedAt,
    createdAt: s.createdAt,
    commentCount: s.comments.length,
    author: userMap[s.userId]
      ? { username: userMap[s.userId].username, profileImageUrl: userMap[s.userId].profileImageUrl, role: userMap[s.userId].role ?? "user" }
      : { username: "unknown", profileImageUrl: null, role: "user" },
  }));
  return NextResponse.json({ scripts: list });
}
