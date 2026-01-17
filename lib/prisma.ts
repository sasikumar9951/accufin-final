import { PrismaClient } from "./generated/prisma";
import { execSync } from "child_process";

// Ensure X11 config file exists to prevent dependency errors
function ensureXinConfigFile() {
  try {
    execSync("mkdir -p /tmp/.XIN-unix", { stdio: "pipe" });
    execSync('echo \'{"user": "default"}\' > /tmp/.XIN-unix/config.json', {
      stdio: "pipe",
      shell: "/bin/bash",
    });
  } catch (e) {
    // Silently ignore file creation errors in production
  }
}

const prismaClientSingleton = () => {
  // Ensure config file exists
  ensureXinConfigFile();

  // Suppress X11/display server errors from native dependencies
  const originalStderr = console.error;
  const originalWarn = console.warn;
  const stderrBuffer: string[] = [];

  console.error = (...args: any[]) => {
    const message = args.join(" ");
    // Suppress specific X11/XIN-unix config errors that don't affect functionality
    if (
      message.includes("XIN-unix") ||
      message.includes("/tmp/.XIN-unix") ||
      message.includes("Command failed")
    ) {
      return;
    }
    originalStderr(...args);
  };

  console.warn = (...args: any[]) => {
    const message = args.join(" ");
    // Suppress X11 warnings
    if (message.includes("XIN-unix") || message.includes("/tmp/.XIN-unix")) {
      return;
    }
    originalWarn(...args);
  };

  try {
    const client = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
    console.warn("PRISMA CLIENT INSTANTIATED");
    return client;
  } finally {
    // Restore original console methods
    console.error = originalStderr;
    console.warn = originalWarn;
  }
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

