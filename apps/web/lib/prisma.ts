import { PrismaClient } from "@prisma/client";
import { isDbDisabled } from "@/lib/flags";

type PrismaLike = PrismaClient;
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createDisabledProxy(): PrismaLike {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("Prisma is disabled by feature flag (DISABLE_DB/DEMO_MODE).");
      }
    }
  ) as PrismaLike;
}

export const prisma: PrismaLike = (() => {
  if (isDbDisabled()) return createDisabledProxy();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required when DISABLE_DB is false.");
  const client = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
})();
