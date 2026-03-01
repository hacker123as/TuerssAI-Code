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

const MAX_SCRIPTS_FREE = 6;

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scriptCount = await prisma.script.count({ where: { userId: user.id } });
  if (scriptCount >= MAX_SCRIPTS_FREE) {
    return NextResponse.json(
      { error: "Script limit reached. Delete a script to create a new one." },
      { status: 403 }
    );
  }
  if (user.credits < 1) {
    return NextResponse.json(
      { error: "You need at least 1 generation to create a new script. Get more generations or redeem a key." },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const title = (body.title as string) || "Untitled Script";
  const script = await prisma.script.create({
    data: { userId: user.id, title },
    select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(script);
}
