import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, profileImageUrl: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const scripts = await prisma.communityScript.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    user: { username: user.username, profileImageUrl: user.profileImageUrl, id: user.id },
    scripts: scripts.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      imageUrl: s.imageUrl,
      madeByAI: s.madeByAI,
      createdAt: s.createdAt,
    })),
  });
}
