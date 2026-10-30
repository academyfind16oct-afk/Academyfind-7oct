import { BlogSearchDocument } from "@/types/BlogSearchDocument";
import { meili } from "@/lib/meilisearch";
import { prisma } from "@/lib/prisma";
import { BlogStatus } from "@/app/generated/prisma/enums";

const index = meili.index("global_search");

export type SearchBlogPostsParams = {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  sort?: "relevance" | "latest" | "oldest" | "popular";
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countWholeWordMatches(text: string, word: string): number {
  if (!text || !word) return 0;
  const escaped = escapeRegex(word);
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function hasPhraseMatch(text: string, phrase: string): boolean {
  if (!text || !phrase) return false;
  const escaped = escapeRegex(phrase.trim());
  const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
  return regex.test(text);
}

const GENERIC_MODIFIERS = new Set([
  'class', 'classes', 'coaching', 'institute', 'institutes',
  'academy', 'academies', 'center', 'centers', 'tuition', 'tuitions',
  'course', 'courses', 'guide', 'preparation', 'school', 'schools',
  'training', 'best', 'top', 'near', 'me', 'in', 'at', 'for',
  'online', 'offline', 'vs', 'and', 'or', 'to', 'the', 'a', 'an'
]);

export async function searchBlogPosts({
  query = "",
  page = 1,
  limit = 9,
  category,
  tag,
  sort = "relevance",
}: SearchBlogPostsParams) {
  try {
    if (process.env.USE_MEILISEARCH !== 'true') {
      throw new Error("Meilisearch disabled, fallback to DB");
    }

    const filters = ['type = "blog"'];

    if (category) {
      filters.push(`categorySlug = "${category}"`);
    }

    if (tag) {
      filters.push(`tagSlugs = "${tag}"`);
    }

    let sortOption: string[] | undefined;

    switch (sort) {
      case "latest":
        sortOption = ["publishedAt:desc"];
        break;

      case "oldest":
        sortOption = ["publishedAt:asc"];
        break;

      case "popular":
        sortOption = ["viewCount:desc"];
        break;

      default:
        sortOption = undefined;
    }

    const results = await index.search<BlogSearchDocument>(query, {
      filter: filters,
      sort: sortOption,
      hitsPerPage: limit,
      page,
    });

    return {
      posts: results.hits.map((hit: BlogSearchDocument) => ({
        ...hit,
        publishedAt: hit.publishedAt
            ? new Date(hit.publishedAt)
            : null,
      })),

      total: results.estimatedTotalHits ?? 0,
      page,
      limit,
      totalPages: Math.ceil((results.estimatedTotalHits ?? 0) / limit) || 1,
      hasNextPage: page < (Math.ceil((results.estimatedTotalHits ?? 0) / limit) || 1),
      hasPreviousPage: page > 1,
    };
  } catch (error) {
    // Graceful degradation to database search with precise word-boundary & relevance scoring
    try {
      const pageNum = Math.max(1, page);
      const skip = (pageNum - 1) * limit;

      const dbWhere: any = {
        status: BlogStatus.PUBLISHED,
        visibility: "PUBLIC",
      };

      if (category) {
        dbWhere.category = { slug: category };
      }

      if (tag) {
        dbWhere.tags = {
          some: {
            tag: { slug: tag },
          },
        };
      }

      const q = query.trim().toLowerCase();
      let rankedPosts: any[] = [];

      if (q) {
        const rawTokens = q.split(/\s+/).filter((t) => t.length > 0);
        const coreTokens = rawTokens.filter((t) => !GENERIC_MODIFIERS.has(t) && t.length > 1);
        const searchTokens = coreTokens.length > 0 ? coreTokens : rawTokens;

        // Efficiently pre-filter candidate posts at the DB level using title, excerpt, category & tags
        // (Excluding contentHtml so substring collisions like 'guidance' or 'attendance' never pull 100+ unrelated posts)
        dbWhere.AND = [
          {
            OR: [
              ...searchTokens.map((token) => ({
                title: { contains: token, mode: "insensitive" as const },
              })),
              ...searchTokens.map((token) => ({
                excerpt: { contains: token, mode: "insensitive" as const },
              })),
              ...searchTokens.map((token) => ({
                category: { name: { contains: token, mode: "insensitive" as const } },
              })),
              ...searchTokens.map((token) => ({
                tags: { some: { tag: { name: { contains: token, mode: "insensitive" as const } } } },
              })),
            ],
          },
        ];
      }

      // Fetch candidate blog posts without loading heavy contentHtml/contentMarkdown
      const dbPosts = await prisma.blogPost.findMany({
        where: dbWhere,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          coverImageAlt: true,
          readingTime: true,
          publishedAt: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          authorProfile: {
            select: {
              displayName: true,
              username: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              avatarUrl: true,
            },
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (q) {
        const rawTokens = q.split(/\s+/).filter((t) => t.length > 0);
        const coreTokens = rawTokens.filter((t) => !GENERIC_MODIFIERS.has(t) && t.length > 1);
        const searchTokens = coreTokens.length > 0 ? coreTokens : rawTokens;

        const scoredPosts: { post: any; score: number }[] = [];

        for (const post of dbPosts) {
          let score = 0;
          const title = post.title || "";
          const excerpt = post.excerpt || "";
          const categoryName = post.category?.name || "";
          const tagNames = post.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [];

          // 1. Exact phrase matching in title / excerpt (Highest priority)
          if (hasPhraseMatch(title, q)) {
            score += 50;
          } else if (hasPhraseMatch(excerpt, q)) {
            score += 25;
          }

          // 2. Category & Tag exact phrase match
          if (hasPhraseMatch(categoryName, q)) {
            score += 30;
          }
          for (const tag of tagNames) {
            if (hasPhraseMatch(tag, q)) {
              score += 25;
              break;
            }
          }

          // 3. Whole-word token matching (Never match substrings in unrelated words like 'guidance' or 'avoidance')
          let matchedCoreTokensCount = 0;
          for (const token of searchTokens) {
            let tokenMatched = false;

            const inTitle = countWholeWordMatches(title, token);
            if (inTitle > 0) {
              tokenMatched = true;
              score += Math.min(inTitle * 20, 40);
            }

            const inExcerpt = countWholeWordMatches(excerpt, token);
            if (inExcerpt > 0) {
              tokenMatched = true;
              score += Math.min(inExcerpt * 10, 20);
            }

            for (const tag of tagNames) {
              if (countWholeWordMatches(tag, token) > 0) {
                tokenMatched = true;
                score += 15;
                break;
              }
            }

            if (countWholeWordMatches(categoryName, token) > 0) {
              tokenMatched = true;
              score += 15;
            }

            if (tokenMatched) {
              matchedCoreTokensCount++;
            }
          }

          // Reward matching all query tokens
          if (searchTokens.length > 1 && matchedCoreTokensCount === searchTokens.length) {
            score += 20;
          }

          // MANDATORY RELEVANCE FILTER:
          // Must match at least one search token as a whole word, and have a positive relevance score
          if (score > 0 && matchedCoreTokensCount > 0) {
            scoredPosts.push({ post, score });
          }
        }

        // Apply sorting to scored posts
        if (sort === "latest") {
          scoredPosts.sort((a, b) => {
            const timeA = a.post.publishedAt?.getTime() ?? 0;
            const timeB = b.post.publishedAt?.getTime() ?? 0;
            if (timeB !== timeA) return timeB - timeA;
            return b.post.id.localeCompare(a.post.id);
          });
        } else if (sort === "oldest") {
          scoredPosts.sort((a, b) => {
            const timeA = a.post.publishedAt?.getTime() ?? 0;
            const timeB = b.post.publishedAt?.getTime() ?? 0;
            if (timeA !== timeB) return timeA - timeB;
            return a.post.id.localeCompare(b.post.id);
          });
        } else if (sort === "popular") {
          scoredPosts.sort((a, b) => {
            if (b.post.viewCount !== a.post.viewCount) return b.post.viewCount - a.post.viewCount;
            const timeA = a.post.publishedAt?.getTime() ?? 0;
            const timeB = b.post.publishedAt?.getTime() ?? 0;
            if (timeB !== timeA) return timeB - timeA;
            return b.post.id.localeCompare(a.post.id);
          });
        } else {
          // default: "relevance"
          scoredPosts.sort((a, b) => {
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            const timeA = a.post.publishedAt?.getTime() ?? 0;
            const timeB = b.post.publishedAt?.getTime() ?? 0;
            if (timeB !== timeA) return timeB - timeA;
            return b.post.id.localeCompare(a.post.id);
          });
        }

        rankedPosts = scoredPosts.map((sp) => sp.post);
      } else {
        // Deterministic sorting if no search query
        rankedPosts = [...dbPosts];
        rankedPosts.sort((a, b) => {
          if (sort === "oldest") {
            const timeA = a.publishedAt?.getTime() ?? 0;
            const timeB = b.publishedAt?.getTime() ?? 0;
            if (timeA !== timeB) return timeA - timeB;
            return a.id.localeCompare(b.id);
          } else if (sort === "popular") {
            if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount;
            const timeA = a.publishedAt?.getTime() ?? 0;
            const timeB = b.publishedAt?.getTime() ?? 0;
            if (timeB !== timeA) return timeB - timeA;
            return b.id.localeCompare(a.id);
          } else {
            // default: "latest" or "relevance" without query
            const timeA = a.publishedAt?.getTime() ?? 0;
            const timeB = b.publishedAt?.getTime() ?? 0;
            if (timeB !== timeA) return timeB - timeA;
            return b.id.localeCompare(a.id);
          }
        });
      }

      const total = rankedPosts.length;
      const paginatedPosts = rankedPosts.slice(skip, skip + limit);
      const totalPages = Math.ceil(total / limit) || 1;

      return {
        posts: paginatedPosts,
        total,
        page: pageNum,
        limit,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      };
    } catch (dbFallbackError) {
      console.error("Search database fallback query failed too:", dbFallbackError);
      return {
        posts: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  }
}

export async function getSearchFilters() {
  try {
    const [categories, tags] = await Promise.all([
      prisma.blogCategory.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),

      prisma.blogTag.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          postCount: true,
        },
      }),
    ]);

    return {
      categories,
      tags,
    };
  } catch (error) {
    console.error("Error loading search filters:", error);

    return {
      categories: [],
      tags: [],
    };
  }
}