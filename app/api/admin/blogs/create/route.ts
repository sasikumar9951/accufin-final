import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, error } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
    try { 
        const user = await requireAdminSession();
        if (!user) return error("Unauthorized", 401);
        const { title, content, tags, isActive = true } = await request.json();
        const blog = await prisma.blogs.create({
            data: { 
                title, 
                content, 
                tags, 
                isActive
            },
        });
        return NextResponse.json(blog);
    }catch(e){
        console.error(e);
        return error("Failed to create blog", 500);
    }
}