import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const script = await prisma.communityScript.findUnique({
    where: { id },
    include: { comments: true },
  });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.communityScript.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
  const author = await prisma.user.findUnique({
    where: { id: script.userId },
    select: { id: true, username: true, profileImageUrl: true },
  });
  const commentUserIds = Array.from(new Set(script.comments.map((c) => c.userId)));
  const commentUsers = await prisma.user.findMany({
    where: { id: { in: commentUserIds } },
    select: { id: true, username: true, profileImageUrl: true },
  });
  const userMap = Object.fromEntries(commentUsers.map((u) => [u.id, u]));
  return NextResponse.json({
    ...script,
    views: script.views + 1,
    author: author ? { username: author.username, profileImageUrl: author.profileImageUrl } : { username: "unknown", profileImageUrl: null },
    comments: script.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: userMap[c.userId] ? { username: userMap[c.userId].username, profileImageUrl: userMap[c.userId].profileImageUrl } : { username: "unknown", profileImageUrl: null },
    })),
  });
}
