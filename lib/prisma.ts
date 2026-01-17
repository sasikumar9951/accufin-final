import { PrismaClient } from "./generated/prisma";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Connection pooling settings for production
    ...(process.env.NODE_ENV === "production" && {
      errorFormat: "pretty",
    }),
  });
};

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Properly preserve singleton in production
if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
} else {
  // Ensure singleton is used in production
  globalThis.prismaGlobal = prisma;
}

// Graceful disconnect on process termination
if (typeof window === "undefined") {
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

export default prisma;
