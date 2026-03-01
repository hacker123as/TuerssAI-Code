import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "lilami@tuerss.com";
const ADMIN_PASSWORD = "Fatouisbest21$";
const TEST_ACCOUNT_EMAIL = "test@tuerss.com";

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
  const secret = process.env.ADMIN_SECRET;
  if (!secret || authHeader !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }
  try {
    const testUser = await prisma.user.findUnique({ where: { email: TEST_ACCOUNT_EMAIL } });
    if (testUser) {
      const communityIds = (await prisma.communityScript.findMany({ where: { userId: testUser.id }, select: { id: true } })).map((s) => s.id);
      if (communityIds.length) await prisma.comment.deleteMany({ where: { communityScriptId: { in: communityIds } } });
      await prisma.communityScript.deleteMany({ where: { userId: testUser.id } });
      await prisma.report.deleteMany({ where: { reporterId: testUser.id } });
      await prisma.script.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    let user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!user) {
      const existingUsername = await prisma.user.findUnique({ where: { username: "lilami" } });
      user = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          username: existingUsername ? `lilami_${Date.now().toString(36)}` : "lilami",
          passwordHash,
          emailVerified: true,
          role: "admin",
          credits: 9999,
        },
      });
      return NextResponse.json({ ok: true, message: "Admin user created; test account removed if present.", email: ADMIN_EMAIL });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin", passwordHash, emailVerified: true },
    });
    return NextResponse.json({ ok: true, message: "Existing user set as admin; test account removed if present.", email: ADMIN_EMAIL });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Seed admin error:", e);
    return NextResponse.json({ error: "Seed failed", detail: message }, { status: 500 });
  }
}
