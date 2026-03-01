import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const code = (body.code as string)?.trim?.();
  if (!code) {
    return NextResponse.json({ error: "Please enter a key." }, { status: 400 });
  }
  const key = await prisma.redeemKey.findUnique({ where: { code } });
  if (!key) {
    return NextResponse.json({ error: "Invalid or already used key." }, { status: 400 });
  }
  if (key.usedById) {
    return NextResponse.json({ error: "This key has already been used." }, { status: 400 });
  }
  if (key.expiresAt && key.expiresAt < new Date()) {
    return NextResponse.json({ error: "This key has expired." }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.redeemKey.update({
      where: { id: key.id },
      data: { usedById: user.id, usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        credits: { increment: key.credits },
        ...(key.plan ? { plan: key.plan } : {}),
      },
    }),
  ]);
  return NextResponse.json({
    ok: true,
    creditsAdded: key.credits,
    plan: key.plan ?? undefined,
  });
}
