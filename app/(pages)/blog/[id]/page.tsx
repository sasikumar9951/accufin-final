"use server";
import Navbar from "@/app/_component/Navbar";
import Footer from "@/app/_component/Footer";
import Read from "@/app/_component/Read";
import prisma from "@/lib/prisma";
import { Suspense } from "react";
import Link from "next/link";

export default async function BlogPage({ params }: { readonly params: Promise<{ id: string }> }) {
  try {
    const blog = await prisma.blogs.findFirst({
      where: {
        id: (await params).id,
        isActive: true,
      },
    });

    if (!blog) {
      return (
        <div>
          <Navbar />
          <div className="flex flex-col items-center justify-center py-32 md:pt-[120px] pt-[150px]">
            <h1 className="text-4xl font-bold">Blog not found</h1>
            <p className="text-gray-500">
              The blog you are looking for does not exist or has been deleted.
            </p>
            <Link href="/blog" className="text-blue-500 hover:text-blue-700">
              Go back to blog
            </Link>
          </div>
          <Footer />
        </div>
      );
    }

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <Navbar />
          <Read
            title={blog.title}
            content={blog.content}
            tags={blog.tags || []}
          />
          <Footer />
        </div>
      </Suspense>
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return (
      <div>
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 md:pt-[120px] pt-[150px]">
          <h1 className="text-4xl font-bold">Error</h1>
          <p className="text-gray-500">
            Failed to load the blog. Please try again later.
          </p>
          <Link href="/blog" className="text-blue-500 hover:text-blue-700">
            Go back to blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }
}
