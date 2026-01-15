import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    region: process.env.SECRET_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.SECRET_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_AWS_SECRET_ACCESS_KEY!,
    },
});

const bucketName = process.env.SECRET_AWS_S3_BUCKET!;

export async function POST(request: NextRequest) {
    try{
        const session = await getServerSession(authOptions)
        if(!session?.user){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const {filePath,contentType} = await request.json();
        if(!filePath){
            return NextResponse.json({ error: "File path is required" }, { status: 400 });
        }
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: filePath,  
            ContentType: contentType,            
        }); 
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 3 }); // 3 minutes
        return NextResponse.json({ signedUrl }, { status: 200 });
    }catch (e){
        console.log(e)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}   
