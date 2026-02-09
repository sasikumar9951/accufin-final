import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error"],

    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma =
  globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

// Only cache in development (avoid hot reload leak)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
