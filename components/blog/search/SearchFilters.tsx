"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

type SearchFiltersProps = {
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];

  tags: {
    id: string;
    name: string;
    slug: string;
    postCount: number;
  }[];
};

export default function SearchFilters({
  categories,
  tags,
}: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <aside className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Filters
        </h2>
        {isPending && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200/50 animate-in fade-in duration-200">
            <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
            Updating...
          </span>
        )}
      </div>

      {/* Sort */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Sort By
        </label>

        <select
          disabled={isPending}
          value={searchParams.get("sort") ?? "relevance"}
          onChange={(e) => updateParam("sort", e.target.value)}
          className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-500 ${
            isPending ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
          }`}
        >
          <option value="relevance">Relevance</option>
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="popular">Most Viewed</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Category
        </label>

        <select
          disabled={isPending}
          value={searchParams.get("category") ?? ""}
          onChange={(e) => updateParam("category", e.target.value)}
          className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-500 ${
            isPending ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
          }`}
        >
          <option value="">All Categories</option>

          {categories.map((category) => (
            <option
              key={category.id}
              value={category.slug}
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tag */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Tag
        </label>

        <select
          disabled={isPending}
          value={searchParams.get("tag") ?? ""}
          onChange={(e) => updateParam("tag", e.target.value)}
          className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-amber-500 ${
            isPending ? "opacity-60 cursor-not-allowed bg-slate-50" : ""
          }`}
        >
          <option value="">All Tags</option>

          {tags.map((tag) => (
            <option
              key={tag.id}
              value={tag.slug}
            >
              {tag.name} ({tag.postCount})
            </option>
          ))}
        </select>
      </div>

      <button
        disabled={isPending}
        onClick={() => {
          startTransition(() => {
            router.push(pathname);
          });
        }}
        className={`w-full rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-100 ${
          isPending ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        Clear Filters
      </button>
    </aside>
  );
}