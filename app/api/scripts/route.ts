import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scripts = await prisma.script.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ scripts });
}

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = (body.title as string) || "Untitled Script";
  const script = await prisma.script.create({
    data: { userId: user.id, title },
    select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(script);
}
