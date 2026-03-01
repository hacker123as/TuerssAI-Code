import { NextResponse } from "next/server";

// Bypass / test account removed. Use normal login. Admin: run seed-admin to create lilami@tuerss.com.
export async function POST() {
  return NextResponse.json(
    { error: "Forbidden", detail: "Test account bypass is disabled." },
    { status: 403 }
  );
}
