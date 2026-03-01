import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, password } = body;
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password required" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email or username already in use" },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        emailVerified: false,
        credits: 20,
      },
    });
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
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
