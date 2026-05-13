import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_REGION = process.env.AWS_REGION ?? "auto";
const S3_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const S3_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
const S3_ENDPOINT = process.env.AWS_ENDPOINT_URL_S3; // custom endpoint for Tigris/R2/etc
const S3_BUCKET = process.env.S3_BUCKET!;
export const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL!;

export const s3 = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  ...(S3_ENDPOINT && { endpoint: S3_ENDPOINT }),
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export async function getUploadUrl(key: string, contentType: string, expiresIn = 300) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, {
    expiresIn,
    unhoistableHeaders: new Set(["x-amz-checksum-crc32", "x-amz-sdk-checksum-algorithm"]),
  });
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export function getPublicUrl(key: string) {
  return `${S3_PUBLIC_URL}/${key}`;
}
