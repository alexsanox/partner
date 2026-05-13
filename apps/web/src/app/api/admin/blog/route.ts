import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

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
