import { PrismaClient } from "@prisma/client";
import { isDemoMode } from "@/lib/demo";

type PrismaLike = PrismaClient;
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createDemoProxy(): PrismaLike {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("Prisma is disabled in DEMO_MODE.");
      }
    }
  ) as PrismaLike;
}

export const prisma: PrismaLike = (() => {
  if (isDemoMode()) return createDemoProxy();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required when DEMO_MODE is false.");
  const client = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
})();
