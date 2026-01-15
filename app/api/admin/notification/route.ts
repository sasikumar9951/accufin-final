import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function GET() {
    try{
        const session = await requireAdminSession();
        if (!session) return error("Unauthorized", 401);

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc"
            },
        })

        return NextResponse.json(notifications, { status: 200 });
    } catch (err) {
        console.error("Error fetching notifications:", err);
        return error("Internal server error", 500);
    }
}

export async function DELETE() {
    try{
        const session = await requireAdminSession();
        if (!session) return error("Unauthorized", 401);
        await prisma.notification.deleteMany({ where: { userId: session.user.id } })
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err) {
        console.error("Error deleting notifications:", err);
        return error("Internal server error", 500);
    }
}