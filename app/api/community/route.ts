import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const scripts = await prisma.communityScript.findMany({
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { comments: true },
  });
  const userIds = Array.from(new Set(scripts.map((s) => s.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, profileImageUrl: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  let filtered = scripts;
  if (q) {
    filtered = scripts.filter((s) => {
      const author = (userMap[s.userId]?.username || "").toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q) ||
        author.includes(q)
      );
    });
  }
  const list = filtered.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    content: s.content,
    imageUrl: s.imageUrl,
    madeByAI: s.madeByAI,
    views: s.views,
    createdAt: s.createdAt,
    commentCount: s.comments.length,
    author: userMap[s.userId] ? { username: userMap[s.userId].username, profileImageUrl: userMap[s.userId].profileImageUrl } : { username: "unknown", profileImageUrl: null },
  }));
  return NextResponse.json({ scripts: list });
}

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { title, description, content, imageUrl, madeByAI } = body as {
    title?: string;
    description?: string;
    content?: string;
    imageUrl?: string | null;
    madeByAI?: boolean;
  };
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const script = await prisma.communityScript.create({
    data: {
      userId: user.id,
      title: title.trim(),
      description: typeof description === "string" ? description.trim().slice(0, 2000) : "",
      content: typeof content === "string" ? content : "",
      imageUrl: typeof imageUrl === "string" && imageUrl.startsWith("data:image/") ? imageUrl.slice(0, 500 * 1024) : null,
      madeByAI: Boolean(madeByAI),
    },
  });
  return NextResponse.json(script);
}
