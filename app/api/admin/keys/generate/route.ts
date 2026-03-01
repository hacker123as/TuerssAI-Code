import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

function generateCode(): string {
  return `TUER-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  const secret = process.env.ADMIN_SECRET;
  if (!secret || authHeader !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const amount = Math.min(100, Math.max(1, parseInt(String(body.amount), 10) || 1));
  const credits = Math.min(10000, Math.max(1, parseInt(String(body.credits), 10) || 20));
  const plan = typeof body.plan === "string" ? body.plan : null;
  const expiresInDays = typeof body.expiresInDays === "number" ? body.expiresInDays : null;
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

  const codes: string[] = [];
  for (let i = 0; i < amount; i++) {
    let code = generateCode();
    let exists = await prisma.redeemKey.findUnique({ where: { code } });
    while (exists) {
      code = generateCode();
      exists = await prisma.redeemKey.findUnique({ where: { code } });
    }
    await prisma.redeemKey.create({
      data: { code, credits, plan, expiresAt },
    });
    codes.push(code);
  }
  return NextResponse.json({ ok: true, codes, credits, plan: plan ?? undefined });
}
