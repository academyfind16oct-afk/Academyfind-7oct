import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
} from "lucide-react";

interface LatestPostsProps {
  posts: any[];
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80";

export default function LatestPosts({ posts }: LatestPostsProps) {
  const formatDate = (dateVal: any) => {
    if (!dateVal) return "Recently";
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(dateVal));
  };

  return (
    <section className="bg-[#FAFAFA] py-24 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="pointer-events-none absolute left-0 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-100/50 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl font-serif">
              Fresh <span className="text-amber-600">Insights.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 font-medium">
              Stay updated with coaching reviews, admission news,
              preparation strategies and career guidance from
              our experts.
            </p>
          </div>

          <Link
            href="/blog/search"
            prefetch={false}
            className="group inline-flex items-center gap-3 self-start rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-200 md:self-auto"
          >
            Explore All
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Dynamic empty state check */}
        {!posts || posts.length === 0 ? (
          <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-20 text-center shadow-sm">
            <h3 className="text-2xl font-bold text-slate-800">No articles found.</h3>
            <p className="mt-3 text-slate-500 max-w-md mx-auto text-base leading-6">
              There are no published articles under this category yet. Check back soon or browse all articles.
            </p>
            <Link
              href="/blog"
              prefetch={false}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 font-bold text-slate-900 transition hover:bg-amber-500 hover:scale-105 active:scale-95"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          <>
            {/* Editorial Asymmetric Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {posts.map((post, i) => {
                // Make every 1st and 6th post span 2 columns on tablet/desktop for an editorial look
                const isLarge = i === 0 || i === 5;
                const spanClasses = isLarge
                  ? "md:col-span-2 lg:col-span-2 flex-col md:flex-row"
                  : "col-span-1 flex-col";

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    prefetch={false}
                    className={`group relative flex overflow-hidden rounded-[2rem] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] ${spanClasses}`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {/* Image */}
                    <div className={`relative overflow-hidden bg-slate-200 ${isLarge ? 'md:w-1/2 aspect-[16/10] md:aspect-auto' : 'w-full aspect-[16/10]'}`}>
                      <Image
                        src={post.coverImage || DEFAULT_IMAGE}
                        alt={post.title}
                        fill
                        className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-900/10 transition-colors group-hover:bg-transparent" />

                      <div className="absolute left-6 top-6 rounded-full bg-white/90 backdrop-blur-md px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-600 shadow-sm">
                        {post.category?.name || "Education"}
                      </div>
                    </div>

                    {/* Body */}
                    <div className={`flex flex-1 flex-col justify-between p-8 xl:p-10 ${isLarge ? 'md:w-1/2' : 'w-full'}`}>
                      <div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <div className="flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4 text-amber-500" />
                            {post.readingTime || 5} min read
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-amber-500" />
                            {formatDate(post.publishedAt)}
                          </div>
                        </div>

                        <h3 className={`mt-6 font-bold leading-tight text-slate-900 font-serif transition-colors group-hover:text-amber-600 ${isLarge ? 'text-3xl lg:text-4xl line-clamp-3' : 'text-2xl line-clamp-3'}`}>
                          {post.title}
                        </h3>

                        <p className={`mt-5 leading-relaxed text-slate-600 font-medium ${isLarge ? 'line-clamp-3 text-lg' : 'line-clamp-2 text-base'}`}>
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="mt-8 flex items-center justify-between border-t border-slate-200/60 pt-6">
                        <span className="text-sm font-bold text-slate-800">
                          By {post.authorProfile?.displayName || post?.brand?.name || "AcademyFind"}
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:translate-x-1">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Load More */}
            <div className="mt-20 flex justify-center">
              <Link
                href="/blog/search"
                prefetch={false}
                className="group inline-flex items-center gap-3 rounded-full border-2 border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 transition-all hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600 hover:shadow-xl hover:shadow-amber-100"
              >
                Discover More Stories
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}