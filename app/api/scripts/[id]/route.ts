import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const script = await prisma.script.findFirst({
    where: { id, userId: user.id },
  });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(script);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const script = await prisma.script.findFirst({
    where: { id, userId: user.id },
  });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await prisma.script.update({
    where: { id },
    data: {
      ...(typeof body.title === "string" && { title: body.title }),
      ...(typeof body.content === "string" && { content: body.content }),
    },
    select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const script = await prisma.script.findFirst({
    where: { id, userId: user.id },
  });
  if (!script) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.script.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
