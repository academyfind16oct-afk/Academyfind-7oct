import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import SearchBar from "./SearchBar";
import TrendingTopics from "./TrendingTopics";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80";

const formatDate = (dateVal: any) => {
  if (!dateVal) return "Recently";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(dateVal));
};

export default function BentoHero({ featuredPosts }: { featuredPosts: any[] }) {
  const [mainPost, sidePost1, sidePost2] = featuredPosts || [];

  return (
    <section className="relative w-full overflow-hidden bg-[#FAFAFA] py-16 sm:py-24">
      {/* Background Glows for Amber theme */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-amber-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[400px] w-[400px] rounded-full bg-rose-200/30 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:grid-rows-[auto_auto] lg:gap-8">

          {/* Main Hero Copy - Spans 7 cols on Desktop */}
          <div className="flex min-w-0 flex-col justify-center rounded-3xl bg-white p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 lg:col-span-7 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 ring-1 ring-amber-200/50">
              <Sparkles className="h-4 w-4 shrink-0" />
              The AcademyFind Blog
            </div>
            <h1 className="mt-6 sm:mt-8 text-4xl sm:text-5xl font-black tracking-tight text-slate-900 lg:text-7xl font-serif">
              Fuel your <br />
              <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                Curiosity.
              </span>
            </h1>
            <p className="mt-4 sm:mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-slate-600">
              Discover the absolute best coaching reviews, expert preparation strategies, and deep dives into the Indian education system.
            </p>

            <div className="mt-6 sm:mt-10">
              {/* Inherits search bar but we wrap it to restrict width if needed */}
              <div className="[&>form]:mx-0 [&>form]:max-w-xl w-full min-w-0">
                <SearchBar />
              </div>
            </div>

            <div className="mt-6 sm:mt-8 [&_.text-slate-500]:text-slate-500 [&_a]:bg-slate-100 [&_a]:text-slate-700 [&_a:hover]:bg-amber-100 [&_a:hover]:text-amber-700 w-full min-w-0">
              <TrendingTopics />
            </div>

            {/* Writer Call to Action */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6">
              <span className="text-sm text-slate-500">Interested in writing for us?</span>
              <Link
                href="/blog/write"
                prefetch={false}
                className="group flex items-center gap-1.5 text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700"
              >
                Join the Creator Workspace
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Main Featured Post - Spans 5 cols */}
          {mainPost ? (
            <Link
              href={`/blog/${mainPost.slug}`}
              prefetch={false}
              className="group relative flex min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] flex-col justify-end overflow-hidden rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 lg:col-span-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150"
            >
              <Image
                src={mainPost.coverImage || DEFAULT_IMAGE}
                alt={mainPost.title}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 via-45% to-transparent" />

              <div className="relative z-10 p-6 sm:p-8">
                <span className="mb-3 sm:mb-4 inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
                  {mainPost.category?.name || "Featured"}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold leading-snug text-white transition-colors group-hover:text-amber-300">
                  {mainPost.title}
                </h3>
                <div className="mt-3 sm:mt-4 flex items-center gap-4 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="h-4 w-4 text-amber-500" />
                    {mainPost.readingTime || 5} min read
                  </div>
                  <span>•</span>
                  <span>{formatDate(mainPost.publishedAt)}</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="hidden lg:col-span-5 lg:block rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100" />
          )}

          {/* Secondary Featured Post 1 - Spans 6 cols */}
          {sidePost1 && (
            <Link
              href={`/blog/${sidePost1.slug}`}
              prefetch={false}
              className="group relative flex aspect-[16/10] min-h-[320px] sm:min-h-[360px] lg:min-h-[380px] flex-col justify-end overflow-hidden rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 lg:col-span-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300"
            >
              <Image
                src={sidePost1.coverImage || DEFAULT_IMAGE}
                alt={sidePost1.title}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 via-45% to-transparent" />

              <div className="relative z-10 flex h-full flex-col justify-between p-6">
                <div className="self-end rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md ring-1 ring-white/20">
                  {sidePost1.category?.name}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold leading-snug text-white transition-colors group-hover:text-amber-300 line-clamp-2">
                    {sidePost1.title}
                  </h3>
                  <div className="mt-2.5 sm:mt-3 flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="text-amber-400 font-medium">{sidePost1.authorProfile?.displayName || "AcademyFind"}</span>
                    <span>•</span>
                    <span>{formatDate(sidePost1.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Secondary Featured Post 2 - Spans 6 cols */}
          {sidePost2 && (
            <Link
              href={`/blog/${sidePost2.slug}`}
              prefetch={false}
              className="group relative flex aspect-[16/10] min-h-[320px] sm:min-h-[360px] lg:min-h-[380px] flex-col justify-end overflow-hidden rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 lg:col-span-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500"
            >
              <Image
                src={sidePost2.coverImage || DEFAULT_IMAGE}
                alt={sidePost2.title}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 via-45% to-transparent" />

              <div className="relative z-10 flex h-full flex-col justify-between p-6">
                <div className="self-end rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md ring-1 ring-white/20">
                  {sidePost2.category?.name}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold leading-snug text-white transition-colors group-hover:text-amber-300 line-clamp-2">
                    {sidePost2.title}
                  </h3>
                  <div className="mt-2.5 sm:mt-3 flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                    <span className="text-amber-400 font-medium">{sidePost2.authorProfile?.displayName || "AcademyFind"}</span>
                    <span>•</span>
                    <span>{formatDate(sidePost2.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
