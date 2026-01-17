import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  sendPermanentDeletionEmailToUser,
  sendPermanentDeletionEmailToAdmin,
  sendPermanentDeletionEmailToSpecificAdmin,
} from "@/lib/email";

export async function POST(request: Request) {
  try {
    const adminSecret = request.headers.get("x-admin-secret");
    const expectedSecret = process.env.ADMIN_SECRET;
    
    if (!expectedSecret) {
      console.error("ADMIN_SECRET environment variable is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    
    if (adminSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const users = await prisma.user.findMany({
      where: {
        isRestorable: true,
        deleteUserAt: { not: null, lte: now },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const purged: Array<{ id: string; email: string | null }> = [];

    // Pre-fetch admin recipients
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { email: true },
    });
    const adminEmails = admins
      .map((a: any) => a.email)
      .filter((e: any): e is string => !!e);

    for (const user of users) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const res = await fetch(
          `${baseUrl}/api/admin/users/${user.id}/delete`,
          {
            method: "DELETE",
            headers: { "x-admin-secret": process.env.ADMIN_SECRET || "" },
          }
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Delete API failed: ${res.status} ${text}`);
        }
        if (user.email) {
          await sendPermanentDeletionEmailToUser({
            userEmail: user.email,
            userName: user.name || undefined,
          });
        }
        // Notify all admins
        if (adminEmails.length > 0) {
          await Promise.all(
            adminEmails.map((adminEmail: any) =>
              sendPermanentDeletionEmailToSpecificAdmin({
                adminEmail,
                userEmail: user.email || undefined,
                userName: user.name || undefined,
              })
            )
          );
        } else {
          // Fallback to single admin email env
          await sendPermanentDeletionEmailToAdmin({
            userEmail: user.email || undefined,
            userName: user.name || undefined,
          });
        }

        purged.push({ id: user.id, email: user.email });
      } catch (err) {
        console.error("Cron purge failed for user:", user.id, err);
      }
    }

    return NextResponse.json({ count: purged.length, purged });
  } catch (error) {
    console.error("Cron purge route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
