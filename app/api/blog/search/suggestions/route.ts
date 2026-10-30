import { NextRequest, NextResponse } from "next/server";
import { meili } from "@/lib/meilisearch";

const index = meili.index("global_search");

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    if (process.env.USE_MEILISEARCH !== 'true') {
      throw new Error("Meilisearch disabled, fallback to DB");
    }


    const results = await index.search(query, {
      filter: ['type IN ["blog","category","tag"]'],
      limit: 8,
    });

    const suggestions = results.hits.map((hit: any) => {
      switch (hit.type) {
        case "blog":
          return {
            id: hit.id,
            type: "blog",
            title: hit.title ?? hit.name,
            subtitle: typeof hit.category === 'object' && hit.category ? hit.category.name : hit.category,
            url: `/blog/${hit.slug}`,
          };

        case "category":
          return {
            id: hit.id,
            type: "category",
            title: hit.name,
            subtitle: "Category",
            url: `/blog/category/${hit.slug}`,
          };

        case "tag":
          return {
            id: hit.id,
            type: "tag",
            title: hit.name,
            subtitle: "Tag",
            url: `/blog/tag/${hit.slug}`,
          };

        default:
          return null;
      }
    });

    return NextResponse.json(
      suggestions.filter(Boolean),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Search suggestions error:", error);

    // DB Fallback
    try {
      const fallbackQuery = request.nextUrl.searchParams.get("q")?.trim();
      if (!fallbackQuery || fallbackQuery.length < 2) return NextResponse.json([]);

      const { prisma } = await import("@/lib/prisma");

      const escapedQ = fallbackQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordRegex = new RegExp(`(^|[^a-zA-Z0-9])${escapedQ}([^a-zA-Z0-9]|$)`, 'i');

      const [candidateBlogs, candidateCategories] = await Promise.all([
        prisma.blogPost.findMany({
          where: {
            status: "PUBLISHED",
            visibility: "PUBLIC",
            title: { contains: fallbackQuery, mode: "insensitive" },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            category: { select: { name: true } },
          },
          take: 12,
        }),
        prisma.blogCategory.findMany({
          where: {
            isActive: true,
            name: { contains: fallbackQuery, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            slug: true,
          },
          take: 8,
        }),
      ]);

      // Enforce word-boundary filtering to eliminate substring collisions (e.g. 'dance' matching 'avoidance' or 'guidance')
      const filteredBlogs = candidateBlogs
        .filter((b) => wordRegex.test(b.title))
        .slice(0, 4);

      const filteredCategories = candidateCategories
        .filter((c) => wordRegex.test(c.name))
        .slice(0, 4);

      const suggestions = [
        ...filteredBlogs.map((b: any) => ({
          id: b.id,
          type: "blog",
          title: b.title,
          subtitle: b.category?.name,
          url: `/blog/${b.slug}`,
        })),
        ...filteredCategories.map((c: any) => ({
          id: c.id,
          type: "category",
          title: c.name,
          subtitle: "Category",
          url: `/blog/category/${c.slug}`,
        })),
      ];

      return NextResponse.json(suggestions, { status: 200 });
    } catch (fallbackError) {
      return NextResponse.json([], { status: 200 });
    }
  }
}