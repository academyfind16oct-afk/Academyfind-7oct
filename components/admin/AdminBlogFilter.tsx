"use client";

import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { BlogStatus } from "@/app/generated/prisma/enums";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AdminBlogFilterProps = {
  query: string;
  status: string | undefined;
  brandId: string | undefined;
  categoryId?: string | undefined;
  sort?: string;
  brands: { id: string; name: string }[];
  categories?: { id: string; name: string; slug: string }[];
  ALL: string;
};

export default function AdminBlogFilter({
  query,
  status,
  brandId,
  categoryId,
  sort = "latest",
  brands,
  categories = [],
  ALL,
}: AdminBlogFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === ALL || (key === "sort" && val === "latest")) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    params.delete("page");
    router.push(`/af-ass-manage/blog?${params.toString()}`);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    const q = formData.get("query")?.toString().trim();
    updateFilters({ query: q });
  };

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_150px_160px_150px]"
    >
      <div className="relative sm:col-span-2 lg:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          name="query"
          defaultValue={query}
          placeholder="Search title or slug…"
          className="h-10 bg-white pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          onBlur={() => handleSubmit()}
        />
      </div>

      <Select 
        name="category" 
        value={categoryId ?? ALL}
        onValueChange={(val) => {
          updateFilters({ category: val });
        }}
      >
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent className="max-h-72 overflow-y-auto">
          <SelectItem value={ALL}>All categories ({categories.length})</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        name="status" 
        value={status ?? ALL}
        onValueChange={(val) => {
          updateFilters({ status: val });
        }}
      >
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {Object.values(BlogStatus).map((item: string) => (
            <SelectItem key={item} value={item}>
              {item === "CONTACTED" ? "Messaged" : item.toLocaleLowerCase().replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        name="brand" 
        value={brandId ?? ALL}
        onValueChange={(val) => {
          updateFilters({ brand: val });
        }}
      >
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All brands</SelectItem>
          {brands.map((brand: { id: string; name: string }) => (
            <SelectItem key={brand.id} value={brand.id}>
              {brand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select 
        name="sort" 
        value={sort === "most_viewed" ? "views" : sort}
        onValueChange={(val) => {
          updateFilters({ sort: val });
        }}
      >
        <SelectTrigger className="h-10 w-full bg-white">
          <SelectValue placeholder="Sort: Latest" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="latest">Sort: Latest</SelectItem>
          <SelectItem value="views">Most Viewed</SelectItem>
          <SelectItem value="comments">Most Comments</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
        </SelectContent>
      </Select>
    </form>
  );
}

