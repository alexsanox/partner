import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      tags: true,
      readMinutes: true,
      publishedAt: true,
      author: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json(posts);
}
