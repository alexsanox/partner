import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ── Rate limit rules ───────────────────────────────────────────────
const LIMITS: Record<string, [limit: number, windowSecs: number]> = {
  "sign-in":                 [5,  60],
  "sign-up":                 [5,  60],
  "forget-password":         [3,  60],
  "reset-password":          [5,  60],
  "send-verification-email": [3,  60],
};

const AUTH_PREFIX = "/api/auth/";

function getIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "global"
  );
}

// ── Security headers ───────────────────────────────────────────────
function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com https://dahlia.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://challenges.cloudflare.com https://api.resend.com https://cdn.jsdelivr.net https://api.stripe.com https://api.modrinth.com",
      "frame-src https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; ")
  );
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getIp(req);

  // ── /admin — strict rate limit + extra headers ─────────────────
  if (pathname.startsWith("/admin")) {
    const { success, reset } = await rateLimit(`rl:admin:${ip}`, 30, 60);
    if (!success) return rateLimitResponse(reset);
  }

  // ── Rate limiting on auth endpoints ───────────────────────────
  if (pathname.startsWith(AUTH_PREFIX)) {
    const action = pathname.slice(AUTH_PREFIX.length).split("/")[0];
    const rule = LIMITS[action];
    if (rule) {
      const key = `rl:auth:${action}:${ip}`;
      const { success, reset } = await rateLimit(key, rule[0], rule[1]);
      if (!success) return rateLimitResponse(reset);
    }
  }

  const res = NextResponse.next();

  // Extra security headers for admin routes
  if (pathname.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
  }

  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)",
  ],
};
