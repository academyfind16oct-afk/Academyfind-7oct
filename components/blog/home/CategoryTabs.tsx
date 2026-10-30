"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Flame, PenLine } from "lucide-react";

interface CategoryTabsProps {
  activeCategorySlug?: string;
  categories: { id: string; name: string; slug: string }[];
}

export default function CategoryTabs({
  activeCategorySlug = "",
  categories,
}: CategoryTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Preserves search query parameters (like sorting/q) while resetting page to 1
  const getCategoryHref = (slug: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", "1");
    if (!slug) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    return `/blog?${params.toString()}`;
  };

  const handleDropdownChange = (slug: string) => {
    router.push(getCategoryHref(slug));
  };

  // Top prominent categories to display as direct pills (e.g. first 10)
  const topPillsCount = 10;
  const prominentCategories = categories.slice(0, topPillsCount);
  const remainingCategories = categories.slice(topPillsCount);

  // Check if current active category is in the remaining categories
  const isSelectedInRemaining = remainingCategories.some(
    (c) => c.slug === activeCategorySlug
  );

  return (
    <div className="sticky top-24 z-40 mx-auto mt-8 flex w-full max-w-fit items-center justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto rounded-full border border-slate-200/50 bg-white/70 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl ring-1 ring-slate-900/5 no-scrollbar sm:gap-3">

        <div className="hidden items-center gap-2 pl-3 pr-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider text-amber-600 sm:flex">
          <Flame className="h-4 w-4" />
          Browse
        </div>

        <Link
          href={getCategoryHref("")}
          prefetch={false}
          className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
            activeCategorySlug === ""
              ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          All
        </Link>

        {prominentCategories.map((category) => (
          <Link
            key={category.slug}
            prefetch={false}
            href={getCategoryHref(category.slug)}
            className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
              activeCategorySlug === category.slug
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {category.name}
          </Link>
        ))}

        {remainingCategories.length > 0 && (
          <div className="relative inline-flex items-center">
            <select
              value={isSelectedInRemaining ? activeCategorySlug : ""}
              onChange={(e) => handleDropdownChange(e.target.value)}
              className={`cursor-pointer appearance-none rounded-full py-2 pl-4 pr-8 text-sm font-semibold transition-all duration-300 outline-none ${
                isSelectedInRemaining
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <option value="" disabled={isSelectedInRemaining}>
                {isSelectedInRemaining
                  ? categories.find((c) => c.slug === activeCategorySlug)?.name || "More categories"
                  : `More categories (${categories.length}+)`}
              </option>
              {remainingCategories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          </div>
        )}

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <Link
          href="/blog/write"
          prefetch={false}
          className="group flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-amber-500 hover:shadow-md hover:shadow-amber-500/20"
        >
          <PenLine className="h-4 w-4" />
          <span className="hidden sm:inline">Write</span>
        </Link>
      </div>
    </div>
  );
}