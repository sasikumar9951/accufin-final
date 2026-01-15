import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

// GET - Fetch all open contacts
export async function GET() {
  try {
    const contacts = await prisma.openContact.findMany();

    if (contacts.length === 0) {
      return NextResponse.json([]);
    }

    const contactIds = contacts.map((c) => c.id);

    const [links, importantDates] = await Promise.all([
      prisma.link.findMany({
        where: { openContactId: { in: contactIds } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.importantDate.findMany({
        where: { openContactId: { in: contactIds } },
        orderBy: { date: "asc" },
      }),
    ]);

    const linksByContactId = new Map<string, any[]>();
    const datesByContactId = new Map<string, any[]>();

    for (const id of contactIds) {
      linksByContactId.set(id, []);
      datesByContactId.set(id, []);
    }

    for (const link of links) {
      const arr = linksByContactId.get(link.openContactId);
      if (arr) arr.push(link);
    }

    for (const date of importantDates) {
      const arr = datesByContactId.get(date.openContactId);
      if (arr) arr.push(date);
    }

    const result = contacts.map((c) => ({
      ...c,
      links: linksByContactId.get(c.id) ?? [],
      importantDates: datesByContactId.get(c.id) ?? [],
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching open contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch open contacts" },
      { status: 500 }
    );
  }
}

// POST - Create new open contact
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { address, phone1, phone2, email, links, importantDates } =
      await request.json();

    const openContact = await prisma.openContact.create({
      data: {
        address,
        phone1,
        phone2,
        email,
        links: {
          create:
            links?.map((link: { name: string; url: string }) => ({
              name: link.name,
              url: link.url,
            })) || [],
        },
        importantDates: {
          create:
            importantDates?.map(
              (date: {
                title: string;
                description?: string;
                date: string;
              }) => ({
                title: date.title,
                description: date.description,
                date: new Date(date.date),
              })
            ) || [],
        },
      },
      include: {
        links: true,
        importantDates: true,
      },
    });

    return NextResponse.json(openContact);
  } catch (error) {
    console.error("Error creating open contact:", error);
    return NextResponse.json(
      { error: "Failed to create open contact" },
      { status: 500 }
    );
  }
}

// PUT - Update open contact
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id, address, phone1, phone2, email, links, importantDates } =
      await request.json();

    // Delete existing links and important dates, then create new ones
    await prisma.link.deleteMany({
      where: { openContactId: id },
    });

    await prisma.importantDate.deleteMany({
      where: { openContactId: id },
    });

    const openContact = await prisma.openContact.update({
      where: { id },
      data: {
        address,
        phone1,
        phone2,
        email,
        links: {
          create:
            links?.map((link: { name: string; url: string }) => ({
              name: link.name,
              url: link.url,
            })) || [],
        },
        importantDates: {
          create:
            importantDates?.map(
              (date: {
                title: string;
                description?: string;
                date: string;
              }) => ({
                title: date.title,
                description: date.description,
                date: new Date(date.date),
              })
            ) || [],
        },
      },
      include: {
        links: true,
        importantDates: true,
      },
    });

    return NextResponse.json(openContact);
  } catch (error) {
    console.error("Error updating open contact:", error);
    return NextResponse.json(
      { error: "Failed to update open contact" },
      { status: 500 }
    );
  }
}

// DELETE - Delete open contact
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID required" },
        { status: 400 }
      );
    }

    await prisma.openContact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting open contact:", error);
    return NextResponse.json(
      { error: "Failed to delete open contact" },
      { status: 500 }
    );
  }
}
