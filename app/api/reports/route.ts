import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const SCRIPT_REASONS = ["inappropriate_script", "malicious_script", "inappropriate_images", "other"] as const;
const ACCOUNT_REASONS = ["inappropriate_image", "inappropriate_username", "other"] as const;

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { targetType, targetId, reason, details } = body as {
    targetType?: string;
    targetId?: string;
    reason?: string;
    details?: string;
  };
  if (targetType !== "script" && targetType !== "account") {
    return NextResponse.json({ error: "targetType must be script or account" }, { status: 400 });
  }
  if (!targetId || typeof targetId !== "string") {
    return NextResponse.json({ error: "targetId is required" }, { status: 400 });
  }
  const validReasons = targetType === "script" ? SCRIPT_REASONS : ACCOUNT_REASONS;
  if (!reason || !validReasons.includes(reason as never)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }
  if (targetType === "account" && targetId === user.id) {
    return NextResponse.json({ error: "You cannot report yourself" }, { status: 400 });
  }
  await prisma.report.create({
    data: {
      reporterId: user.id,
      targetType,
      targetId,
      reason,
      details: typeof details === "string" ? details.trim().slice(0, 1000) : null,
    },
  });
  return NextResponse.json({ ok: true });
}
