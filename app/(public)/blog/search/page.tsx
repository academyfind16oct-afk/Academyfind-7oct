// app/blog/search/page.tsx

import type { Metadata } from "next";

import Breadcrumb from "@/components/blog/article/BreadCrumb";
import NewsletterCTA from "@/components/blog/article/NewsLetterCTA";

import SearchHero from "@/components/blog/search/SearchHero";
import SearchFilters from "@/components/blog/search/SearchFilters";
import SearchResultGrid from "@/components/blog/search/SearchResultGrid";
import SearchEmptyState from "@/components/blog/search/SearchEmptyState";
import SearchJsonLd from "@/components/blog/search/SearchJsonLd";
import Pagination from "@/components/blog/shared/Pagination";

import {
  getSearchFilters,
  searchBlogPosts,
} from "@/lib/User/user/blog/search";

type Props = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    sort?: "relevance" | "latest" | "oldest" | "popular";
    page?: string;
  }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;

  const query = params.q?.trim();

  return {
    title: query
      ? `Search: ${query} | AcademyFind Blog`
      : "Search Blog | AcademyFind",

    description: query
      ? `Search results for "${query}" on AcademyFind Blog.`
      : "Search blog articles, guides, tutorials and expert insights.",

    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const query = params.q ?? "";
  const category = params.category;
  const tag = params.tag;
  const sort = params.sort ?? "relevance";

  const page = Number(params.page ?? "1");

  const [results, filters] = await Promise.all([
    searchBlogPosts({
      query,
      category,
      tag,
      sort,
      page,
      limit: 9,
    }),

    getSearchFilters(),
  ]);

  return (
    <>
      <SearchJsonLd query={query} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            {
              label: "Blog",
              href: "/blog",
            },
            {
              label: "Search",
            },
          ]}
        />

        <SearchHero
          initialQuery={query}
          totalResults={results.total}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside>
            <SearchFilters
              categories={filters.categories}
              tags={filters.tags}
            />
          </aside>

          <main id="search-results-content">
            {results.posts.length > 0 ? (
              <>
                <SearchResultGrid
                  posts={results.posts}
                />

                <Pagination
                  currentPage={results.page}
                  totalPages={results.totalPages}
                />
              </>
            ) : (
              <SearchEmptyState query={query} />
            )}
          </main>
        </div>

        <div className="mt-20">
          <NewsletterCTA />
        </div>
      </div>
    </>
  );
}