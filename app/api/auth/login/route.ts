import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken, ensureDailyCredits } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    await ensureDailyCredits(user.id);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    const credits = updated?.credits ?? user.credits;
    const token = await createToken({
      id: user.id,
      email: user.email,
      username: user.username,
      credits,
    });
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, credits },
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
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
