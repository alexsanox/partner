import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { ArrowRight, Clock, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Blog | PobbleHost" };
export const revalidate = 60;

function tagColor(tag: string) {
  const map: Record<string, string> = {
    guide: "bg-[#00c98d]/10 text-[#00c98d]",
    tutorial: "bg-[#00c98d]/10 text-[#00c98d]",
    security: "bg-yellow-400/10 text-yellow-400",
    news: "bg-blue-400/10 text-blue-400",
    update: "bg-blue-400/10 text-blue-400",
  };
  return map[tag.toLowerCase()] ?? "bg-white/10 text-white";
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
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

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/[0.05] py-20 sm:py-24">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#00c98d]/8 blur-[100px]" />
          </div>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">Blog</p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">News &amp; Guides</h1>
            <p className="mt-5 text-lg text-[#a8b0c4]">Tips, tutorials, and updates from the PobbleHost team.</p>
          </div>
        </section>

        {/* Posts grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <p className="text-[#8b92a8] text-lg">No posts yet — check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl border border-white/[0.07] bg-[#131720] overflow-hidden transition-all hover:-translate-y-0.5 hover:border-[#00c98d]/25 hover:shadow-xl hover:shadow-[#00c98d]/5"
                >
                  {/* Cover */}
                  {post.coverImage ? (
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-[#1a2540] to-[#0d1117] flex items-center justify-center">
                      <span className="text-5xl opacity-20">📝</span>
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-6">
                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 2).map((t) => (
                          <span key={t} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tagColor(t)}`}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <h2 className="text-base font-bold text-white group-hover:text-[#4dd9ae] transition-colors leading-snug">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="mt-2 text-sm leading-relaxed text-[#8b92a8] line-clamp-2">{post.excerpt}</p>
                    )}

                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {post.author.image ? (
                          <Image src={post.author.image} alt={post.author.name ?? ""} width={22} height={22} className="rounded-full" unoptimized />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00c98d]/15">
                            <User className="h-3 w-3 text-[#00c98d]" />
                          </div>
                        )}
                        <span className="text-[11px] text-[#8b92a8]">{post.author.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#8b92a8]">
                        <Clock className="h-3 w-3" />
                        {post.readMinutes} min read
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-[#00c98d]">
                      Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
