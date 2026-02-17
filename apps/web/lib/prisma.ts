import { isDemoMode } from "@/lib/demo";

type PrismaLike = any;
const globalForPrisma = globalThis as unknown as { prisma?: PrismaLike };

function createDemoProxy(): PrismaLike {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("Prisma is disabled in DEMO_MODE.");
      }
    }
  );
}

function createMissingDbUrlProxy(): PrismaLike {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("DATABASE_URL is required when DEMO_MODE is false.");
      }
    }
  );
}

function createPrismaClient(): PrismaLike {
  // Delay loading @prisma/client so demo/no-db builds don't fail at module import time.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require("@prisma/client") as { PrismaClient?: new () => PrismaLike };
  if (!PrismaClient) {
    throw new Error("PrismaClient is unavailable. Run prisma generate and ensure @prisma/client is installed.");
  }

  const client = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

let cachedPrisma: PrismaLike | undefined;

function getPrisma(): PrismaLike {
  if (cachedPrisma) return cachedPrisma;

  if (isDemoMode()) {
    cachedPrisma = createDemoProxy();
    return cachedPrisma;
  }

  if (!process.env.DATABASE_URL) {
    cachedPrisma = createMissingDbUrlProxy();
    return cachedPrisma;
  }

  cachedPrisma = createPrismaClient();
  return cachedPrisma;
}

export const prisma: PrismaLike = new Proxy({}, {
  get(_target, prop, receiver) {
    const instance = getPrisma();
    return Reflect.get(instance, prop, receiver);
  }
});
