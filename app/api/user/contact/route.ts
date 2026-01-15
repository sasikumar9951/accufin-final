import { NextRequest, NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/email";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const contactSchema = z.object({
      name: z.string().trim().min(1, "Name is required"),
      email: z.string().trim().email("Invalid email format"),
      subject: z.string().trim().min(1, "Subject is required"),
      message: z.string().trim().min(1, "Message is required"),
    });

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    // Get current timestamp
    const submittedAt = new Date().toLocaleString("en-US", {
      timeZone: "America/Vancouver",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Send email to admin
    const emailResult = await sendContactFormEmail({
      name,
      email,
      subject,
      message,
      submittedAt,
    });

    if (!emailResult.success) {
      console.error("Failed to send contact form email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
