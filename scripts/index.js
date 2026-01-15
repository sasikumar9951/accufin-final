#!/usr/bin/env node

// Load environment variables from .env file if it exists
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from project root if it exists
const envPath = join(__dirname, "..", ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log("[cron] Loaded environment variables from .env file");
} else {
  console.log("[cron] No .env file found, using system environment variables");
}

function parseTime24h(value, fallback) {
  if (!value) return fallback;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return fallback;
  const hours = Math.min(23, Math.max(0, Number.parseInt(match[1], 10)));
  const minutes = Math.min(59, Math.max(0, Number.parseInt(match[2], 10)));
  return { hours, minutes };
}

function msUntilNextTrigger(hours, minutes) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

async function trigger(path) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${baseUrl}${path}`;
  const adminSecret = process.env.ADMIN_SECRET;

  if (!adminSecret) {
    console.error(
      `[cron] ADMIN_SECRET environment variable is not set! Cannot call ${path}`
    );
    return;
  }

  const headers = {
    "x-admin-secret": adminSecret,
  };

  try {
    console.log(
      `[cron] Calling ${url} with admin secret: ${adminSecret.slice(0, 2)}***`
    );
    const res = await fetch(url, { method: "POST", headers });
    const text = await res.text();
    console.log(`[cron] POST ${path} ->`, res.status, text);
  } catch (err) {
    console.error(`[cron] POST ${path} failed:`, err);
  }
}

function scheduleDaily(label, timeEnv, defaultH, defaultM, path) {
  const { hours, minutes } = parseTime24h(process.env[timeEnv], {
    hours: defaultH,
    minutes: defaultM,
  });
  console.log(
    `[cron:${label}] will run daily at ${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`
  );

  const scheduleNext = () => {
    const delay = msUntilNextTrigger(hours, minutes);
    console.log(`[cron:${label}] next run in ${Math.round(delay / 1000)}s`);
    setTimeout(async () => {
      await trigger(path);
      scheduleNext();
    }, delay);
  };

  scheduleNext();
}

function scheduleHourlyTopOfHour(label, path) {
  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    if (next <= now) next.setHours(next.getHours() + 1);
    const delay = next.getTime() - now.getTime();
    console.log(`[cron:${label}] next run in ${Math.round(delay / 1000)}s`);
    setTimeout(async () => {
      await trigger(path);
      scheduleNext();
    }, delay);
  };
  console.log(`[cron:${label}] will run hourly at the top of the hour`);
  scheduleNext();
}

// function scheduleEveryMinute(label, path) {
//   const scheduleNext = () => {
//     const now = new Date();
//     const next = new Date(now);
//     next.setSeconds(0, 0);
//     if (next <= now) next.setMinutes(next.getMinutes() + 1);
//     const delay = next.getTime() - now.getTime();
//     console.log(`[cron:${label}] next run in ${Math.round(delay / 1000)}s`);
//     setTimeout(async () => {
//       await trigger(path);
//       scheduleNext();
//     }, delay);
//   };
//   console.log(`[cron:${label}] will run every minute`);
//   scheduleNext();
// }

function main() {
  // Log cron envs (mask secrets)
  console.log("[cron] env:", {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "(not set)",
    BIRTHDAY_CRON_TIME: process.env.BIRTHDAY_CRON_TIME || "(not set)",
    MFA_CRON_TIME: process.env.MFA_CRON_TIME || "(not set)",
    RECOMPUTE_STORAGE_CRON_TIME:
      process.env.RECOMPUTE_STORAGE_CRON_TIME || "(not set)",
    ADMIN_SECRET: process.env.ADMIN_SECRET ? "***" : "(not set)",
  });

  // Check required environment variables
  if (!process.env.ADMIN_SECRET) {
    process.exit(1);
  }

  if (!process.env.NEXTAUTH_URL) {
    console.warn(
      "[cron] WARNING: NEXTAUTH_URL not set, using default http://localhost:3000"
    );
  }

  // Birthday cron (existing behavior)
  scheduleDaily("birthday", "BIRTHDAY_CRON_TIME", 9, 0, "/api/cron/birthdays");
  // MFA reminder cron (new)
  scheduleDaily("mfa", "MFA_CRON_TIME", 10, 0, "/api/cron/mfa-reminders");
  // Storage recomputation cron (new)
  scheduleDaily(
    "recompute-storage",
    "RECOMPUTE_STORAGE_CRON_TIME",
    9,
    15,
    "/api/admin/recompute-storage"
  );
  // Purge soft-deleted users every minute (for testing)
  scheduleHourlyTopOfHour("purge", "/api/cron/purge-soft-deleted");
  scheduleHourlyTopOfHour("storage", "/api/cron/storage-threshold");

}
main();

// curl -X POST 'http://localhost:3000/api/cron/mfa-reminders' \
//   -H 'x-admin-secret: admin'

// curl -X POST 'http://localhost:3000/api/cron/birthdays' \
//   -H 'x-admin-secret: admin'

// curl -X POST 'http://localhost:3000/api/admin/recompute-storage' \
//   -H 'x-admin-secret: admin'
