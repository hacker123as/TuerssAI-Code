import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tuerss-dev-secret-change-in-production-32ch"
);

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  credits: number;
};

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("tuerss_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getUserFromSession() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, username: true, credits: true, lastDailyGrant: true, profileImageUrl: true, theme: true, aiLanguage: true, plan: true },
  });
  return user;
}

const DAILY_CREDITS = 10; // free users get 10 generations per day

export async function ensureDailyCredits(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  if (user.lastDailyGrant === today) return;
  await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: DAILY_CREDITS }, lastDailyGrant: today },
  });
}
