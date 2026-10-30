import { Metadata } from "next";
import Script from "next/script";
import BentoHero from "@/components/blog/home/hero/BentoHero";
import CategoryTabs from "@/components/blog/home/CategoryTabs";
import LatestPosts from "@/components/blog/home/LatestPosts";
import TrendingPosts from "@/components/blog/home/TrendingPosts";
import ExploreByExam from "@/components/blog/home/ExploreByExam";
import ExploreByCity from "@/components/blog/home/ExploreByCity";
import Newsletter from "@/components/blog/home/Newsletter";
import CTASection from "@/components/blog/home/CTASection";

import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{
    category?: string;
  }>;
};

// Requirement #3: SEO Dynamic Metadata based on URL filters
export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const categorySlug = params.category;

  if (categorySlug) {
    const category = await prisma.blogCategory.findUnique({
      where: { slug: categorySlug, isActive: true },
      select: {
        name: true,
        metaTitle: true,
        metaDescription: true,
        description: true,
      },
    });

    if (category) {
      return {
        title: category.metaTitle || `${category.name} Articles | AcademyFind Blog`,
        description:
          category.metaDescription ||
          category.description ||
          `Explore the latest ${category.name} guides, preparation hacks and study updates.`,
        alternates: {
          canonical: `https://academyfind.com/blog?category=${categorySlug}`,
        },
      };
    }
  }

  return {
    title: "Blog & Educational Resources | AcademyFind",
    description:
      "Read the latest insights, expert interviews, exam tips, and study hacks on the AcademyFind blog. Discover helpful preparation guides and coaching reviews.",
    alternates: {
      canonical: "https://academyfind.com/blog",
    },
    openGraph: {
      title: "AcademyFind Blog",
      description: "Expert educational insights and study hacks are brewing. Stay tuned!",
      url: "https://academyfind.com/blog",
      type: "website",
    },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const categorySlug = params.category;

  // Requirement #16: Category Validation & fallback
  let categoryFilterId: string | undefined;
  if (categorySlug) {
    const cat = await prisma.blogCategory.findUnique({
      where: { slug: categorySlug, isActive: true },
      select: { id: true },
    });
    if (cat) {
      categoryFilterId = cat.id;
    } else {
      // Map to a non-existent UUID to trigger empty state gracefully
      categoryFilterId = "invalid_category_slug_non_existent";
    }
  }

  // Requirement #12 & #17: Promise.all parallel loading & explicit homepage limits
  const [categories, featuredPosts, latestPosts, trendingPosts, instituteCount, articleCount, cityCount, categoryCount] = await Promise.all([
    // Active Categories list
    prisma.blogCategory.findMany({
      where: { isActive: true },
      orderBy: [{ postCount: "desc" }, { order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    }),

    // Featured Posts: Max 3, checks featuredUntil duration
    prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        isFeatured: true,
        OR: [
          { featuredUntil: null },
          { featuredUntil: { gt: new Date() } },
        ],
      },
      include: {
        category: true,
        authorProfile: true,
        brand: true,
      },
      orderBy: [
        { featuredOrder: "asc" },
        { publishedAt: "desc" },
        { id: "desc" },
      ],
      take: 3,
    }),

    // Latest Posts: Max 9, supports filtering and deterministic ordering
    prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
        ...(categoryFilterId ? { categoryId: categoryFilterId } : {}),
      },
      include: {
        category: true,
        authorProfile: true,
        brand: true,
      },
      orderBy: [
        { isPinned: "desc" },
        { publishedAt: "desc" },
        { id: "desc" },
      ],
      take: 9,
    }),

    // Trending Posts: Max 4
    prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      include: {
        category: true,
        authorProfile: true,
        brand: true,
      },
      orderBy: [
        { viewCount: "desc" },
        { publishedAt: "desc" },
        { id: "desc" },
      ],
      take: 4,
    }),

    // CTA Section Stats
    prisma.institute.count(),
    prisma.blogPost.count({ where: { status: "PUBLISHED", visibility: "PUBLIC" } }),
    prisma.city.count(),
    prisma.category.count(),
  ]);

  const stats = {
    institutes: instituteCount,
    articles: articleCount,
    cities: cityCount,
    categories: categoryCount,
  };

  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AcademyFind Blog - Educational Resources & Study Hacks",
    description: "Read the latest insights, expert interviews, exam tips, and study hacks on the AcademyFind blog.",
    url: "https://academyfind.com/blog",
  };

  return (
    <div className="overflow-x-hidden min-w-0 w-full flex flex-col">
      <Script id="schema-blog-collection" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }} />
      <BentoHero featuredPosts={featuredPosts} />
      <LatestPosts posts={latestPosts} />
      <TrendingPosts posts={trendingPosts} />
      <ExploreByExam />
      <ExploreByCity />
      <CategoryTabs activeCategorySlug={categorySlug} categories={categories} />
      <Newsletter />
      <CTASection stats={stats} />
    </div>
  );
}