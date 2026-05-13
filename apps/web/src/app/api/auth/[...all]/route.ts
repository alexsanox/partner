import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const authHandler = toNextJsHandler(auth);

// Limits per endpoint (requests / window seconds)
const LIMITS: Record<string, [number, number]> = {
  "sign-in":           [5,  60],
  "sign-up":           [5,  60],
  "forget-password":   [3,  60],
  "reset-password":    [5,  60],
  "send-verification-email": [3, 60],
};

function getIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "global"
  );
}

export async function GET(req: NextRequest) {
  return authHandler.GET(req);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ all: string[] }> }) {
  const params = await ctx.params;
  const action = params.all?.at(-1) ?? "";
  const limitRule = LIMITS[action];

  if (limitRule) {
    const ip = getIp(req);
    const key = `rl:auth:${action}:${ip}`;
    const { success, reset } = await rateLimit(key, limitRule[0], limitRule[1]);
    if (!success) return rateLimitResponse(reset);
  }

  return authHandler.POST(req);
}
