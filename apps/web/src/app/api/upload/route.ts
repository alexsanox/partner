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

    // If the endpoint is localhost/internal, rewrite the presigned URL host
    // to the public-facing S3 URL so the browser can reach it
    const s3Endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? "";
    const s3Public = process.env.S3_PUBLIC_URL ?? "";
    if (s3Endpoint && s3Public && (s3Endpoint.includes("localhost") || s3Endpoint.includes("127.0.0.1"))) {
      // Replace internal endpoint with public URL in the presigned URL
      const internalUrl = new URL(uploadUrl);
      const publicBase = new URL(s3Public);
      internalUrl.protocol = publicBase.protocol;
      internalUrl.host = publicBase.host;
      // strip the bucket prefix from path since public URL already includes it via /s3/ proxy
      uploadUrl = internalUrl.toString();
    }

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Failed to get upload URL" }, { status: 500 });
  }
}
