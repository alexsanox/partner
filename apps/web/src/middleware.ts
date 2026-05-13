import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const ADMIN_HOSTNAME = "admin.novally.tech";
const MAIN_HOSTNAME = "novally.tech";

// ── Upstash Redis rate limiters ────────────────────────────────────
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
let redis: Redis | null = null;
let authLimiter: Ratelimit | null = null;
let strictLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;

function getRedis() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    // 5 requests per minute for login/register
    authLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "rl:auth",
    });
    // 3 requests per minute for password reset / verification
    strictLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 m"),
      prefix: "rl:strict",
    });
    // 120 requests per minute for general API
    apiLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      prefix: "rl:api",
    });
  }
  return { authLimiter, strictLimiter, apiLimiter };
}

type LimiterKey = "auth" | "strict" | "api" | null;

function getLimiterForPath(pathname: string): LimiterKey {
  if (/^\/api\/auth\/(sign-in|sign-up)/.test(pathname))        return "auth";
  if (/^\/api\/auth\/(forgot|reset|send-verification)/.test(pathname)) return "strict";
  if (/^\/api\//.test(pathname))                                return "api";
  return null;
}

// ── Security headers ───────────────────────────────────────────────
function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://challenges.cloudflare.com https://api.resend.com",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ")
  );
  return res;
}

function tooManyRequests(retryAfter = "60"): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": retryAfter },
    }
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get("host")?.split(":")[0] ?? "";

  // ── Admin subdomain routing ────────────────────────────────────
  if (hostname === ADMIN_HOSTNAME) {
    const url = req.nextUrl.clone();
    if (!pathname.startsWith("/admin")) {
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      return addSecurityHeaders(NextResponse.rewrite(url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Redirect /admin on main domain → admin subdomain (not in dev)
  if (hostname === MAIN_HOSTNAME && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("https://admin.novally.tech", req.url));
  }

  // ── Rate limiting via Upstash Redis ───────────────────────────
  const limiterKey = getLimiterForPath(pathname);
  if (limiterKey) {
    const { authLimiter: al, strictLimiter: sl, apiLimiter: gl } = getRedis();
    const limiter = limiterKey === "auth" ? al : limiterKey === "strict" ? sl : gl;

    if (limiter) {
      const ip =
        req.headers.get("cf-connecting-ip") ??
        req.headers.get("x-real-ip") ??
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "global";

      const { success, reset } = await limiter.limit(ip);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000).toString();
        return tooManyRequests(retryAfter);
      }
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)",
  ],
};
