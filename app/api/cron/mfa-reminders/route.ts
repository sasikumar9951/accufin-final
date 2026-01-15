import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendMfaReminderEmail } from "@/lib/email";

// GET/POST: find all active users without TOTP enabled and send reminder email
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret");
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        NOT: { totpEnabled: true },
      },
      select: {
        id: true,
        name: true,
        email: true,
        totpEnabled: true,
        isActive: true,
      },
    });

    const results: Array<{ id: string; email: string; success: boolean }> = [];

    for (const user of users) {
      if (!user.email) continue;
      const res = await sendMfaReminderEmail({
        userEmail: user.email,
        userName: user.name || "",
      });
      results.push({ id: user.id, email: user.email, success: !!res.success });
    }

    return NextResponse.json({ count: users.length, results });
  } catch (error) {
    console.error("MFA reminder cron route error:", error);
    return NextResponse.json(
      { error: "Failed to process MFA reminders" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Allow manual trigger via GET for convenience
  return POST(req);
}
