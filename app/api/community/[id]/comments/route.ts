import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { communityScriptId: id },
    orderBy: { createdAt: "asc" },
  });
  const userIds = [...new Set(comments.map((c) => c.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, profileImageUrl: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const list = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: userMap[c.userId] ? { username: userMap[c.userId].username, profileImageUrl: userMap[c.userId].profileImageUrl } : { username: "unknown", profileImageUrl: null },
  }));
  return NextResponse.json({ comments: list });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const script = await prisma.communityScript.findUnique({ where: { id } });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 2000) : "";
  if (!content) return NextResponse.json({ error: "Comment is required" }, { status: 400 });
  const comment = await prisma.comment.create({
    data: { communityScriptId: id, userId: user.id, content },
  });
  const author = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true, profileImageUrl: true },
  });
  return NextResponse.json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: author ? { username: author.username, profileImageUrl: author.profileImageUrl } : { username: user.username, profileImageUrl: null },
  });
}
