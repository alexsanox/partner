import { NextRequest, NextResponse } from "next/server";

const ADMIN_HOSTNAME = "admin.novally.tech";
const MAIN_HOSTNAME = "novally.tech";

// ── In-memory rate limiter (per-IP, resets on restart) ─────────────
// For production at scale, swap the map for Redis (ioredis/upstash).
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function rateLimit(
  ip: string,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const id = `${ip}:${key}`;
  const now = Date.now();
  const entry = rateLimitStore.get(id);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(id, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= limit) return false; // blocked

  entry.count++;
  return true;
}

// Clean up stale entries every ~100 requests to avoid memory leak
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter < 100) return;
  cleanupCounter = 0;
  const now = Date.now();
  for (const [key, val] of rateLimitStore) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}

// ── Rate limit rules ───────────────────────────────────────────────
const RATE_RULES: { pattern: RegExp; limit: number; windowMs: number }[] = [
  { pattern: /^\/api\/auth\/sign-in/,          limit: 5,  windowMs: 60_000  },
  { pattern: /^\/api\/auth\/sign-up/,           limit: 5,  windowMs: 60_000  },
  { pattern: /^\/api\/auth\/forgot-password/,   limit: 3,  windowMs: 60_000  },
  { pattern: /^\/api\/auth\/reset-password/,    limit: 5,  windowMs: 60_000  },
  { pattern: /^\/api\/auth\/send-verification/, limit: 3,  windowMs: 60_000  },
  { pattern: /^\/api\/webhooks\//,              limit: 30, windowMs: 60_000  },
  { pattern: /^\/api\//,                        limit: 120, windowMs: 60_000 },
];

// ── Security headers ───────────────────────────────────────────────
function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
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

export function middleware(req: NextRequest) {
  const { pathname, hostname } = req.nextUrl;
  maybeCleanup();

  // ── Admin subdomain routing ────────────────────────────────────
  // admin.novally.tech/* → rewrite to /admin/*
  if (hostname === ADMIN_HOSTNAME) {
    // Block non-admin paths on this subdomain
    const url = req.nextUrl.clone();
    if (!pathname.startsWith("/admin")) {
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      const res = NextResponse.rewrite(url);
      return addSecurityHeaders(res);
    }
    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  // On main domain, block direct access to /admin routes
  if (
    (hostname === MAIN_HOSTNAME || hostname === "localhost") &&
    pathname.startsWith("/admin") &&
    hostname !== "localhost" // allow localhost for dev
  ) {
    return NextResponse.redirect(new URL("https://admin.novally.tech", req.url));
  }

  // ── Rate limiting ──────────────────────────────────────────────
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  for (const rule of RATE_RULES) {
    if (rule.pattern.test(pathname)) {
      if (!rateLimit(ip, pathname.split("?")[0], rule.limit, rule.windowMs)) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60",
            },
          }
        );
      }
      break;
    }
  }

  const res = NextResponse.next();
  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)",
  ],
};
