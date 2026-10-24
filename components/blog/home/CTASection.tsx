import Link from "next/link";
import { ArrowRight, Search, Building2 } from "lucide-react";

interface CTASectionProps {
  stats?: {
    institutes: number;
    articles: number;
    cities: number;
    categories: number;
  };
}

export default function CTASection({ stats }: CTASectionProps) {
  // Helper to format numbers like 1200 -> 1.2K+
  const formatStat = (num?: number, fallback: string = "0") => {
    if (num === undefined || num === null) return fallback;
    if (num === 0) return "0";
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(1)}Cr+`;
    }
    if (num >= 100000) {
      return `${(num / 100000).toFixed(1)}L+`;
    }

    const formatted = new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(num);

    return `${formatted}+`;
  };

  return (
    <section className="relative overflow-hidden py-24">
      {/* Background */}

      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_40%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_35%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-10 text-center shadow-2xl backdrop-blur-xl lg:p-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <Building2 className="h-4 w-4" />
            AcademyFind
          </span>

          <h2 className="mx-auto mt-8 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Find the Right Coaching.
            <br />
            Build Your Dream Career.
          </h2>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/90">
            Compare thousands of coaching institutes across India,
            explore verified student reviews, discover expert guides
            and make confident admission decisions with AcademyFind.
          </p>

          {/* Buttons */}

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              prefetch={false}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 font-semibold text-slate-900 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-100"
            >
              <Search className="h-5 w-5" />

              Explore Institutes

              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/compare"
              prefetch={false}
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-8 font-semibold text-white backdrop-blur transition-all duration-300 hover:bg-white/20"
            >
              Compare Coaching
            </Link>
          </div>

          {/* Stats */}

          <div className="mt-16 grid grid-cols-2 gap-8 border-t border-white/20 pt-10 md:grid-cols-4">
            <div>
              <div className="text-3xl font-black text-white">
                {formatStat(stats?.institutes, "10K+")}
              </div>

              <p className="mt-2 text-white/80">
                Institutes
              </p>
            </div>

            <div>
              <div className="text-3xl font-black text-white">
                {formatStat(stats?.articles, "1.2K+")}
              </div>

              <p className="mt-2 text-white/80">
                Articles
              </p>
            </div>

            <div>
              <div className="text-3xl font-black text-white">
                {formatStat(stats?.cities, "500+")}
              </div>

              <p className="mt-2 text-white/80">
                Cities
              </p>
            </div>

            <div>
              <div className="text-3xl font-black text-white">
                {formatStat(stats?.categories, "25+")}
              </div>

              <p className="mt-2 text-white/80">
                Exam Categories
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}