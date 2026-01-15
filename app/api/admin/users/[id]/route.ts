import { NextResponse } from "next/server";
import { requireAdminSession, error } from "@/lib/api-helpers";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    if (!session) return error("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      contactNumber,
      occupation,
      sinNumber,
      businessNumber,
      dateOfBirth,
      address,
      sendBirthdayEmail,
      isAdmin,
      maxStorageLimit,
    } = body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name ?? undefined,
        contactNumber: contactNumber ?? undefined,
        occupation: occupation ?? undefined,
        sinNumber: sinNumber ?? undefined,
        businessNumber: businessNumber ?? undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address: address ?? undefined,
        sendBirthdayEmail: sendBirthdayEmail ?? undefined,
        isAdmin: typeof isAdmin === "boolean" ? isAdmin : undefined,
        maxStorageLimit:
          typeof maxStorageLimit === "number" && maxStorageLimit > 0
            ? Math.floor(maxStorageLimit)
            : undefined,
      },
      select: {
        id: true,
        name: true,
        contactNumber: true,
        occupation: true,
        sinNumber: true,
        businessNumber: true,
        dateOfBirth: true,
        address: true,
        sendBirthdayEmail: true,
        isAdmin: true,
        maxStorageLimit: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Error updating user:", e);
    return error("Internal server error", 500);
  }
}
