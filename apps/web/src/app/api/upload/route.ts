import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { getUploadUrl, getPublicUrl } from "@/lib/r2";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm",
];

const MAX_SIZE_MB = 50;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { filename, contentType, sizeBytes, folder = "uploads" } = await req.json() as {
      filename: string;
      contentType: string;
      sizeBytes: number;
      folder?: string;
    };

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    if (sizeBytes > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Max file size is ${MAX_SIZE_MB}MB` }, { status: 400 });
    }

    const ext = filename.split(".").pop() ?? "bin";
    const key = `${folder}/${session.user.id}/${randomBytes(8).toString("hex")}.${ext}`;

    let uploadUrl = await getUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);

    // If the endpoint is localhost/internal, rewrite the presigned URL
    // to the public-facing URL so the browser can reach it (no CORS needed)
    const s3Endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? "";
    const s3Public = process.env.S3_PUBLIC_URL ?? "";
    if (s3Endpoint && s3Public && (s3Endpoint.includes("localhost") || s3Endpoint.includes("127.0.0.1"))) {
      // s3Public = https://novally.tech/s3
      // uploadUrl = http://localhost:1481/pobble/blog/...?sig=...
      // result   = https://novally.tech/s3/blog/...?sig=...
      const internalUrl = new URL(uploadUrl);
      const publicBase = new URL(s3Public); // https://novally.tech/s3
      const bucket = process.env.S3_BUCKET ?? "";
      // Remove leading /bucket from path
      const pathWithoutBucket = internalUrl.pathname.startsWith(`/${bucket}`)
        ? internalUrl.pathname.slice(bucket.length + 1)
        : internalUrl.pathname;
      const rewritten = new URL(publicBase.toString());
      rewritten.pathname = publicBase.pathname.replace(/\/$/, "") + pathWithoutBucket;
      rewritten.search = internalUrl.search;
      uploadUrl = rewritten.toString();
    }

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Failed to get upload URL" }, { status: 500 });
  }
}
