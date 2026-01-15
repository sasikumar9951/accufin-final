import { PrismaClient } from "./generated/prisma";

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
  console.warn("PRISMA CLIENT INSTANTIATED");
  return client;
};

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Properly preserve singleton in production
if (process.env.NODE_ENV !== "production") {
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
