import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUserSession, error } from "@/lib/api-helpers";
import { getSignedUrlFromPath } from "@/lib/s3";

export async function GET() {
  const session = await requireUserSession();
  if (!session) return error("Unauthorized", 401);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      storageUsed: true,
      maxStorageLimit: true,
      sinNumber: true,
      businessNumber: true,
      dateOfBirth: true,
      contactNumber: true,
      address: true,
      occupation: true,
      isAdmin: true,
      createdAt: true,
      profileUrl: true,
      updatedAt: true,
      provider: true,
      sendBirthdayEmail: true,
    },
  });
  if (!user) return error("User not found", 404);
  let signedUrl: string | null = null;
  if (user.profileUrl) {
    try {
      // Check if it's a Google profile image URL
      if (user.profileUrl.includes('googleusercontent.com') || user.profileUrl.startsWith('https://lh3.googleusercontent.com')) {
        // For Google profile images, use the URL directly but ensure it's properly formatted
        signedUrl = user.profileUrl;
        // If the URL doesn't have size parameters, add a reasonable default
        if (signedUrl && !signedUrl.includes('=s') && !signedUrl.includes('=w')) {
          signedUrl = signedUrl + '=s200';
        }
        // If it has =s96-c, it might be better to change to a simpler format for better compatibility
        if (signedUrl && signedUrl.includes('=s96-c')) {
          signedUrl = signedUrl.replace('=s96-c', '=s200');
        }
      } else if (user.profileUrl.startsWith('https://')) {
        // For other HTTPS URLs, use directly (could be other OAuth providers)
        signedUrl = user.profileUrl;
      } else {
        // For S3 paths, generate signed URL
        signedUrl = await getSignedUrlFromPath(user.profileUrl);
      }
    } catch (error) {
      console.error('Error processing profile URL for user', user.id, ':', error);
      // Set to null if there's an error processing the URL
      signedUrl = null;
    }
  }
  return NextResponse.json({ ...user, profileImageUrl: signedUrl });
}

export async function PUT(req: NextRequest) {
  const session = await requireUserSession();
  if (!session) return error("Unauthorized", 401);
  const {
    name,
    sinNumber,
    businessNumber,
    dateOfBirth,
    contactNumber,
    address,
    occupation,
    profileUrl,
    sendBirthdayEmail,
  } = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      sinNumber,
      businessNumber,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      contactNumber,
      address,
      occupation,
      profileUrl,
      sendBirthdayEmail,
    },
    select: {
      id: true,
      email: true,
      name: true,
      sinNumber: true,
      businessNumber: true,
      dateOfBirth: true,
      contactNumber: true,
      address: true,
      occupation: true,
      profileUrl: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      provider: true,
      sendBirthdayEmail: true,
    },
  });
  let signedUrl: string | null = null;
  if (user.profileUrl) {
    try {
      // Check if it's a Google profile image URL
      if (user.profileUrl.includes('googleusercontent.com') || user.profileUrl.startsWith('https://lh3.googleusercontent.com')) {
        // For Google profile images, use the URL directly but ensure it's properly formatted
        signedUrl = user.profileUrl;
        // If the URL doesn't have size parameters, add a reasonable default
        if (signedUrl && !signedUrl.includes('=s') && !signedUrl.includes('=w')) {
          signedUrl = signedUrl + '=s200';
        }
        // If it has =s96-c, it might be better to change to a simpler format for better compatibility
        if (signedUrl && signedUrl.includes('=s96-c')) {
          signedUrl = signedUrl.replace('=s96-c', '=s200');
        }
      } else if (user.profileUrl.startsWith('https://')) {
        // For other HTTPS URLs, use directly (could be other OAuth providers)
        signedUrl = user.profileUrl;
      } else {
        // For S3 paths, generate signed URL
        signedUrl = await getSignedUrlFromPath(user.profileUrl);
      }
    } catch (error) {
      console.error('Error processing profile URL for user', user.id, ':', error);
      // Set to null if there's an error processing the URL
      signedUrl = null;
    }
  }
  return NextResponse.json({ ...user, profileImageUrl: signedUrl });
}
