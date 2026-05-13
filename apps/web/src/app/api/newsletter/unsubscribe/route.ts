import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return new NextResponse("Missing email", { status: 400 });

  try {
    await prisma.newsletterSubscriber.deleteMany({ where: { email: decodeURIComponent(email) } });
  } catch {
    // already removed — ignore
  }

  return new NextResponse(
    `<!DOCTYPE html><html><body style="margin:0;padding:40px;background:#0f1219;font-family:system-ui,sans-serif;text-align:center;">
      <h2 style="color:#fff;">You've been unsubscribed</h2>
      <p style="color:#8b92a8;">You won't receive any more emails from PobbleHost.</p>
      <a href="https://novally.tech" style="color:#00c98d;">Back to PobbleHost</a>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
