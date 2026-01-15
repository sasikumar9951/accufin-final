
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ping = url.searchParams.get("ping");

  if (ping) {
    return NextResponse.json({ ok: true, ping }, { status: 200 });
  }

  return NextResponse.json(
    {
      message:
        "register-admin endpoint is reachable. Use POST with JSON body { email, password, secret, name } to register an admin.",
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  const { email, password, secret, name } = await request.json();

  console.log(email, password, secret);

  if (!email || !password || !secret) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const isExisting = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isExisting) {
    return NextResponse.json(
      { error: "Admin already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, isAdmin: true, name },
  });
  console.log("Created admin user:", user);

  return NextResponse.json(
    { message: "Admin registered successfully" },
    { status: 200 }
  );
}
