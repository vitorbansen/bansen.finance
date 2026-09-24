import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"],
    // Banco remoto (Neon): transações com várias idas e voltas passam dos 5s padrão.
    transactionOptions: { maxWait: 10_000, timeout: 20_000 },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
