"use client";

import { useState, useEffect } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function BlogToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -60% 0px" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#1a1e2e] p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-[#8b92a8] mb-4">Table Of Contents</p>
      <ul className="space-y-0.5">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                setActive(h.id);
              }}
              className={`block py-1.5 text-[13px] leading-snug transition-colors truncate ${
                h.level === 1 ? "pl-0" : h.level === 2 ? "pl-3" : "pl-6"
              } ${active === h.id ? "text-[#00c98d] font-semibold" : "text-[#8b92a8] hover:text-white"}`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
