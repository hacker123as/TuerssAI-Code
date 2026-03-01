import { PrismaClient } from "@prisma/client";

// Atlas requires a database name: ensure URL has one (e.g. /tuerss) before the query string
const raw = process.env.DATABASE_URL ?? "";
if (raw && /\.mongodb\.net\/?(\?|$)/.test(raw)) {
  process.env.DATABASE_URL = raw.replace(/\.mongodb\.net\/?(\?|$)/, ".mongodb.net/tuerss$1");
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
