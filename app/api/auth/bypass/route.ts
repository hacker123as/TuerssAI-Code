import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken, ensureDailyCredits } from "@/lib/auth";

const TEST_EMAIL = "test@tuerss.com";
const TEST_USERNAME = "testaccount";
const TEST_PASSWORD = "test-bypass-123";

export async function POST() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Bypass failed", detail: "DATABASE_URL is not set. Add it in Vercel Environment Variables." },
      { status: 500 }
    );
  }
  if (!process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Bypass failed", detail: "JWT_SECRET is not set. Add it in Vercel Environment Variables." },
      { status: 500 }
    );
  }
  try {
    let user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (!user) {
      const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
      user = await prisma.user.create({
        data: {
          email: TEST_EMAIL,
          username: TEST_USERNAME,
          passwordHash,
          emailVerified: true,
          credits: 20,
        },
      });
    } else {
      await ensureDailyCredits(user.id);
      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      user = updated ?? user;
    }
    const token = await createToken({
      id: user.id,
      email: user.email,
      username: user.username,
      credits: user.credits,
    });
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, credits: user.credits },
    });
    res.cookies.set("tuerss_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Bypass error:", e);
    return NextResponse.json(
      { error: "Bypass failed", detail: message },
      { status: 500 }
    );
  }
}
