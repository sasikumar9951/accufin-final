import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["error"],
    // Aggressive connection cleanup
    errorFormat: "pretty",
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Properly disconnect on process exit
if (typeof global !== "undefined") {
  process.on("exit", async () => {
    await prisma.$disconnect();
  });
}

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
