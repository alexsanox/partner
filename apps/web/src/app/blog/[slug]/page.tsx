import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Clock, Calendar, User, ChevronRight } from "lucide-react";
import { marked } from "marked";
import { BlogToc } from "@/components/blog/blog-toc";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug, published: true } });
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} | PobbleHost Blog`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

function extractHeadings(markdown: string): { id: string; text: string; level: number }[] {
  const lines = markdown.split("\n");
  const headings: { id: string; text: string; level: number }[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");
      headings.push({ id, text, level: match[1].length });
    }
  }
  return headings;
}

function addIdsToHeadings(html: string): string {
  return html.replace(/<h([1-3])>(.+?)<\/h[1-3]>/g, (_match, level, content) => {
    const text = content.replace(/<[^>]+>/g, "");
    const id = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-");
    return `<h${level} id="${id}">${content}</h${level}>`;
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { author: { select: { name: true, image: true } } },
  });

  if (!post) notFound();

  const rawHtml = await marked(post.content, { async: true });
  const html = addIdsToHeadings(rawHtml);
  const headings = extractHeadings(post.content);

  return (
    <>
      <Navbar />
      <main className="bg-[#0d1117] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[#8b92a8] mb-8">
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white truncate max-w-xs">{post.title}</span>
          </nav>

          <div className="flex gap-10 items-start">
            {/* Main content */}
            <article className="flex-1 min-w-0">
              {/* Cover */}
              {post.coverImage && (
                <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden mb-8">
                  <Image src={post.coverImage} alt={post.title} fill className="object-cover" unoptimized />
                </div>
              )}

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((t) => (
                    <span key={t} className="rounded-full bg-[#00c98d]/10 px-3 py-1 text-xs font-semibold text-[#00c98d]">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">{post.title}</h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#8b92a8] mb-8 pb-8 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  {post.author.image ? (
                    <Image src={post.author.image} alt={post.author.name ?? ""} width={28} height={28} className="rounded-full" unoptimized />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00c98d]/15">
                      <User className="h-3.5 w-3.5 text-[#00c98d]" />
                    </div>
                  )}
                  <span className="font-medium text-white">{post.author.name}</span>
                </div>
                {post.publishedAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readMinutes} min read
                </div>
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-base text-[#a8b0c4] leading-relaxed mb-8 font-medium">{post.excerpt}</p>
              )}

              {/* Rendered Markdown */}
              <div
                className="prose-blog"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </article>

            {/* Sidebar ToC */}
            {headings.length > 0 && (
              <aside className="hidden lg:block w-72 shrink-0 sticky top-8">
                <BlogToc headings={headings} />
              </aside>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
