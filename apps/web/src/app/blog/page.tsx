import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Blog" };

const posts = [
  {
    slug: "choosing-minecraft-server-ram",
    title: "How Much RAM Does Your Minecraft Server Actually Need?",
    excerpt: "A practical guide to choosing the right plan for your player count, mod count, and world size.",
    tag: "Guide",
    date: "May 10, 2026",
    readTime: "5 min read",
  },
  {
    slug: "top-paper-plugins-2026",
    title: "Top 10 Paper Plugins for 2026",
    excerpt: "From performance boosters to quality-of-life improvements — the best plugins for any server.",
    tag: "Top Lists",
    date: "May 5, 2026",
    readTime: "7 min read",
  },
  {
    slug: "ddos-protection-explained",
    title: "DDoS Protection Explained: How We Keep Your Server Online",
    excerpt: "A deep-dive into how our multi-layer DDoS mitigation keeps your server online even under attack.",
    tag: "Security",
    date: "Apr 28, 2026",
    readTime: "6 min read",
  },
  {
    slug: "modpack-server-guide",
    title: "Setting Up a Modpack Server: Complete Guide",
    excerpt: "Step-by-step instructions for running any Forge or Fabric modpack with PobbleHost.",
    tag: "Guide",
    date: "Apr 20, 2026",
    readTime: "9 min read",
  },
];

const tagColors: Record<string, string> = {
  Guide: "bg-[#00c98d]/10 text-[#00c98d]",
  "Top Lists": "bg-purple-400/10 text-purple-400",
  Security: "bg-yellow-400/10 text-yellow-400",
};

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
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

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-xl border border-white/[0.07] bg-[#131720] p-6 transition-all hover:-translate-y-0.5 hover:border-[#00c98d]/25 hover:bg-[#181d2e] hover:shadow-lg hover:shadow-[#00c98d]/8"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tagColors[post.tag] ?? "bg-white/10 text-white"}`}>
                    {post.tag}
                  </span>
                  <span className="text-xs text-[#8b92a8]">{post.readTime}</span>
                </div>
                <h2 className="mt-4 text-lg font-bold text-white group-hover:text-[#4dd9ae] transition-colors">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#8b92a8]">{post.excerpt}</p>
                <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-[#00c98d]">
                  Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-3 text-xs text-[#8b92a8]/60">{post.date}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
