import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "noreply@pobble.host";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://novally.tech";

async function sendNewPostEmail(post: { title: string; slug: string; excerpt: string | null; coverImage: string | null }) {
  const subscribers = await prisma.newsletterSubscriber.findMany({ select: { email: true } });
  if (!subscribers.length) return;

  const postUrl = `${APP_URL}/blog/${post.slug}`;
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f1219;font-family:'Segoe UI',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1219;"><tr><td align="center" style="padding:40px 16px;">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
  <tr><td style="padding-bottom:24px;"><span style="font-size:22px;font-weight:800;color:#fff;">Pobble<span style="color:#00c98d;">Host</span></span></td></tr>
  ${post.coverImage ? `<tr><td style="padding-bottom:20px;"><img src="${post.coverImage}" width="520" style="width:100%;border-radius:12px;display:block;" alt="Cover"/></td></tr>` : ""}
  <tr><td style="background:#1a1e2e;border-radius:16px;padding:32px;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#00c98d;text-transform:uppercase;letter-spacing:1px;">New Post</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#fff;line-height:1.3;">${post.title}</h1>
    ${post.excerpt ? `<p style="margin:0 0 24px;font-size:15px;color:#8b92a8;line-height:1.6;">${post.excerpt}</p>` : ""}
    <a href="${postUrl}" style="display:inline-block;background:#00c98d;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">Read Post →</a>
  </td></tr>
  <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#8b92a8;">
    You're receiving this because you subscribed to PobbleHost updates.<br/>
    <a href="${APP_URL}/api/newsletter/unsubscribe?email={{EMAIL}}" style="color:#8b92a8;">Unsubscribe</a>
  </td></tr>
</table></td></tr></table></body></html>`;

  await Promise.allSettled(
    subscribers.map((s) =>
      resend.emails.send({
        from: FROM,
        to: s.email,
        subject: `New Post: ${post.title}`,
        html: html.replace("{{EMAIL}}", encodeURIComponent(s.email)),
      })
    )
  );
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { title, excerpt, content, coverImage, tags, published, readMinutes } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  let slug = slugify(title);
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: excerpt ?? null,
      content,
      coverImage: coverImage ?? null,
      tags: tags ?? [],
      published: published ?? false,
      publishedAt: published ? new Date() : null,
      readMinutes: readMinutes ?? 5,
      authorId: session.user.id,
    },
  });

  if (published) {
    sendNewPostEmail(post).catch(console.error);
  }

  return NextResponse.json(post, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id, title, excerpt, content, coverImage, tags, published, readMinutes } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(title !== undefined && { title, slug: slugify(title) }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
      ...(coverImage !== undefined && { coverImage }),
      ...(tags !== undefined && { tags }),
      ...(readMinutes !== undefined && { readMinutes }),
      ...(published !== undefined && {
        published,
        publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
      }),
    },
  });

  // Send newsletter if being published for the first time
  if (published && !existing.published) {
    sendNewPostEmail(post).catch(console.error);
  }

  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
