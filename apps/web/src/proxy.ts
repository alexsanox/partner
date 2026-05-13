import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// ── Rate limit rules ───────────────────────────────────────────────
// [limit per window, windowSecs]
const LIMITS: Record<string, [limit: number, windowSecs: number]> = {
  "sign-in":                 [10, 300],  // 10 attempts per 5 min
  "sign-up":                 [8,  300],  // 8 registrations per 5 min
  "forget-password":         [5,  300],  // 5 resets per 5 min
  "reset-password":          [8,  300],
  "send-verification-email": [5,  300],
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
      "connect-src 'self' https://challenges.cloudflare.com https://api.resend.com https://cdn.jsdelivr.net https://api.stripe.com https://api.modrinth.com https://*.t3.storage.dev https://t3.storage.dev https://novally.tech https://media.novally.tech",
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

  // ── Rate limiting on auth endpoints (soft throttle — no hard block) ──
  if (pathname.startsWith(AUTH_PREFIX)) {
    const action = pathname.slice(AUTH_PREFIX.length).split("/")[0];
    const rule = LIMITS[action];
    if (rule) {
      const key = `rl:auth:${action}:${ip}`;
      const { success, remaining } = await rateLimit(key, rule[0], rule[1]);
      if (!success) {
        // Soft throttle: add increasing delay instead of hard 429
        const delay = Math.min(remaining === 0 ? 3000 : 1000, 5000);
        await new Promise((r) => setTimeout(r, delay));
      }
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
