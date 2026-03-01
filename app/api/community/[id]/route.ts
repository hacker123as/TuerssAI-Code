import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
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
  const updated = await prisma.communityScript.update({
    where: { id },
    data: { views: { increment: 1 } },
    include: { comments: true },
  });
  const author = await prisma.user.findUnique({
    where: { id: updated.userId },
    select: { id: true, username: true, profileImageUrl: true, role: true },
  });
  const commentUserIds = Array.from(new Set(updated.comments.map((c) => c.userId)));
  const commentUsers = await prisma.user.findMany({
    where: { id: { in: commentUserIds } },
    select: { id: true, username: true, profileImageUrl: true, role: true },
  });
  const userMap = Object.fromEntries(commentUsers.map((u) => [u.id, u]));
  return NextResponse.json({
    ...updated,
    author: author ? { username: author.username, profileImageUrl: author.profileImageUrl, role: author.role ?? "user" } : { username: "unknown", profileImageUrl: null, role: "user" },
    comments: updated.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      author: userMap[c.userId] ? { username: userMap[c.userId].username, profileImageUrl: userMap[c.userId].profileImageUrl, role: userMap[c.userId].role ?? "user" } : { username: "unknown", profileImageUrl: null, role: "user" },
    })),
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const script = await prisma.communityScript.findUnique({ where: { id } });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const verified = body.verified;
  if (typeof verified !== "boolean") {
    return NextResponse.json({ error: "verified (boolean) required" }, { status: 400 });
  }
  const updated = await prisma.communityScript.update({
    where: { id },
    data: { verified, verifiedAt: verified ? new Date() : null, verifiedById: verified ? user.id : null },
  });
  return NextResponse.json(updated);
}
