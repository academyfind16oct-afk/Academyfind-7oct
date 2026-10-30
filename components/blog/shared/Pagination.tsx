"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, MouseEvent } from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export default function Pagination({
  currentPage,
  totalPages,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [targetPage, setTargetPage] = useState<number | null>(null);

  if (totalPages <= 1) {
    return null;
  }

  function getPageUrl(page: number): string {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }

  function handlePageClick(e: MouseEvent<HTMLAnchorElement>, page: number) {
    e.preventDefault();
    if (page === currentPage || page < 1 || page > totalPages || isPending) {
      return;
    }

    setTargetPage(page);

    // Smooth scroll to top of search results so user is not stuck looking at bottom buttons
    const target =
      document.getElementById("search-results-content") ||
      document.getElementById("search-results-grid") ||
      document.querySelector("main");

    if (target) {
      const yOffset = -90;
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    } else {
      window.scrollTo({ top: 300, behavior: "smooth" });
    }

    const url = getPageUrl(page);
    startTransition(() => {
      router.push(url);
    });
  }

  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
  }

  const prevPage = currentPage - 1;
  const nextPage = currentPage + 1;
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav
      aria-label="Blog Pagination"
      className="mt-12 flex flex-col items-center justify-center gap-3 select-none"
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {/* Previous Button */}
        {isFirst ? (
          <span
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm font-medium text-slate-400 cursor-not-allowed opacity-50"
            aria-disabled="true"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </span>
        ) : (
          <Link
            href={getPageUrl(prevPage)}
            onClick={(e) => handlePageClick(e, prevPage)}
            prefetch={false}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700 active:scale-95 ${
              isPending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {isPending && targetPage === prevPage ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Previous</span>
          </Link>
        )}

        {/* Page Numbers */}
        {pages.map((page: number | "...", index: number) =>
          page === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-slate-400 font-medium"
            >
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={getPageUrl(page)}
              onClick={(e) => handlePageClick(e, page)}
              prefetch={false}
              className={`relative inline-flex h-10 min-w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                page === currentPage
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/40"
                  : isPending && targetPage === page
                  ? "border border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-300/50 animate-pulse"
                  : "border border-slate-200/90 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-700 shadow-sm"
              } ${isPending ? "pointer-events-none" : ""}`}
            >
              {isPending && targetPage === page ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              ) : (
                page
              )}
            </Link>
          )
        )}

        {/* Next Button */}
        {isLast ? (
          <span
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-sm font-medium text-slate-400 cursor-not-allowed opacity-50"
            aria-disabled="true"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <Link
            href={getPageUrl(nextPage)}
            onClick={(e) => handlePageClick(e, nextPage)}
            prefetch={false}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700 active:scale-95 ${
              isPending ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            {isPending && targetPage === nextPage ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Link>
        )}
      </div>

      {/* Subtle feedback indicator during page transition */}
      {isPending && targetPage && (
        <div className="flex items-center gap-2 rounded-full bg-amber-50/90 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200/60 shadow-sm animate-in fade-in duration-200">
          <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
          <span>Loading page {targetPage}...</span>
        </div>
      )}
    </nav>
  );
}
