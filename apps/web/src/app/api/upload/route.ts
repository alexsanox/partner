import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { s3, getPublicUrl } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm",
];

const MAX_SIZE_MB = 50;
const S3_BUCKET = process.env.S3_BUCKET!;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Max file size is ${MAX_SIZE_MB}MB` }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const key = `${folder}/${session.user.id}/${randomBytes(8).toString("hex")}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.length,
    }));

    const publicUrl = getPublicUrl(key);
    return NextResponse.json({ publicUrl, key });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
