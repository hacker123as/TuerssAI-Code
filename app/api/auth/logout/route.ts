import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("tuerss_session", "", { maxAge: 0, path: "/" });
  return res;
}
