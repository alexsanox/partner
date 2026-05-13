import { redis } from "./redis";

/**
 * Sliding window rate limiter backed by self-hosted Redis.
 * Returns { success, remaining, reset }
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now();
  const windowMs = windowSecs * 1000;
  const resetAt = now + windowMs;

  try {
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - windowMs);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.pexpire(key, windowMs);
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    const remaining = Math.max(0, limit - count);
    const success = count <= limit;

    return { success, remaining, reset: resetAt };
  } catch {
    // If Redis is down, fail open (don't block requests)
    return { success: true, remaining: limit, reset: resetAt };
  }
}

import { NextResponse } from "next/server";

export function rateLimitResponse(reset: number): NextResponse {
  const retryAfter = Math.ceil((reset - Date.now()) / 1000).toString();
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": retryAfter } }
  );
}
