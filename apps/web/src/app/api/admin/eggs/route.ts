import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getEggs, getEgg } from "@/lib/pelican";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const allEggs: {
      id: number;
      uuid: string;
      name: string;
      description: string | null;
      dockerImages: Record<string, string>;
      startup: string;
      variables: { name: string; envVariable: string; defaultValue: string; description: string; userViewable: boolean; userEditable: boolean }[];
    }[] = [];

    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const res = await getEggs(page) as unknown as Record<string, unknown>;

      // Pelican may return { data: [...] } with or without meta.pagination
      const items = Array.isArray(res.data) ? res.data as { object: string; attributes: Record<string, unknown> }[] : [];
      const meta = res.meta as { pagination?: { total_pages?: number } } | undefined;
      if (meta?.pagination?.total_pages) {
        totalPages = meta.pagination.total_pages;
      } else {
        totalPages = 1; // no pagination — single page
      }

      for (const item of items) {
        const egg = item.attributes as {
          id: number; uuid: string; name: string; description: string | null;
          docker_images: Record<string, string>; startup: string;
          relationships?: { variables?: { data: { attributes: { name: string; env_variable: string; default_value: string; description: string; user_viewable: boolean; user_editable: boolean } }[] } };
        };
        const vars = egg.relationships?.variables?.data.map((v) => ({
          name: v.attributes.name,
          envVariable: v.attributes.env_variable,
          defaultValue: v.attributes.default_value,
          description: v.attributes.description,
          userViewable: v.attributes.user_viewable,
          userEditable: v.attributes.user_editable,
        })) ?? [];

        allEggs.push({
          id: egg.id,
          uuid: egg.uuid,
          name: egg.name,
          description: egg.description,
          dockerImages: egg.docker_images,
          startup: egg.startup,
          variables: vars,
        });
      }

      page++;
    }

    return NextResponse.json(allEggs);
  } catch (err) {
    console.error("[admin/eggs] Failed to fetch eggs:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch eggs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
