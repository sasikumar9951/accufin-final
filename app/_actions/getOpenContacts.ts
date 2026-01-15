"use server";
import prisma from "@/lib/prisma";

export async function getOpenContacts() {
  const openContacts = await prisma.openContact.findFirst({
    include: {
      links: true,
      importantDates: {
        orderBy: {
          date: "asc",
        },
      },
    },
  });
  return openContacts;
}
