import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowRight, Scale, TrendingUp, Users, Building2 } from 'lucide-react';
import CompareSearchBar from '@/components/User/CompareSearchBar';

export const metadata = {
  title: 'Compare Coaching Institutes Side-by-Side | AcademyFind',
  description:
    'Compare fees, ratings, facilities, faculty and results of coaching institutes, dance academies, sports coaching and more — side by side, before you decide.',
};

export default async function CompareHubPage() {
  const [topComparisons, instituteCount, comparisonCount] = await Promise.all([
    prisma.instituteComparisonCache.findMany({
      orderBy: { viewCount: 'desc' },
      take: 9,
      include: {
        institute1: { select: { name: true, logo: true, city: { select: { name: true } } } },
        institute2: { select: { name: true, logo: true } },
      },
    }),
    prisma.institute.count({ where: { isActive: true } }),
    prisma.instituteComparisonCache.count(),
  ]);

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* ==========================================
          HERO — search-first, not a static banner
          ========================================== */}
      <div className="relative overflow-y-visible z-102 border-b border-stone-200 bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[120%] -translate-x-1/2 rounded-[100%] bg-amber-50"
        />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-20 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-600 shadow-sm">
            <Scale className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">
            Don&apos;t guess. <span className="text-amber-500">Compare.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-stone-500">
            Fees, ratings, facilities, faculty and real student results — side by side, before you pay a rupee.
          </p>

          <CompareSearchBar />

          {/* Trust strip */}
          <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-8 border-t border-stone-100 pt-6 text-stone-400">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span 
                title={`${instituteCount.toLocaleString('en-IN')}+ institutes`}
                className="text-sm font-semibold tabular-nums text-stone-600"
              >
                {instituteCount >= 100000 ? `${(instituteCount / 100000).toFixed(1)}L+` : `${instituteCount.toLocaleString('en-IN')}+`}
              </span>
              <span className="text-xs">institutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span className="text-sm font-semibold tabular-nums text-stone-600">
                {comparisonCount.toLocaleString('en-IN')}+
              </span>
              <span className="text-xs">comparisons</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          POPULAR COMPARISONS
          ========================================== */}
      <div className="mx-auto mt-16 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600">
              <TrendingUp className="h-3.5 w-3.5" /> Trending
            </p>
            <h2 className="text-2xl font-bold text-stone-900">Popular Comparisons</h2>
          </div>
        </div>

        {topComparisons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-14 text-center">
            <Scale className="mx-auto mb-3 h-8 w-8 text-stone-300" />
            <p className="font-medium text-stone-600">No comparisons yet</p>
            <p className="mt-1 text-sm text-stone-400">
              Search two institutes above to create the first one.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topComparisons.map((comp: any, i:any) => (
              <Link prefetch={false} key={comp.id} href={`/compare/${comp.slug}`} className="group">
                <div className="relative flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/60">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-[11px] font-bold tabular-nums text-white">
                      {i + 1}
                    </span>
                    {comp.institute1.city?.name && (
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-stone-500">
                        {comp.institute1.city.name}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold leading-snug text-stone-800">
                    {comp.institute1.name}
                    <span className="mx-2 text-sm font-normal text-amber-500">vs</span>
                    {comp.institute2.name}
                  </h3>

                  {comp.verdict && (
                    <p className="mt-2 text-xs text-stone-400">
                      Verdict: <span className="font-semibold text-stone-600">{comp.verdict}</span>
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-6">
                    <span className="text-xs text-stone-400">
                      {comp.viewCount.toLocaleString('en-IN')} views
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-amber-600 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">
                      Compare <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          WHY COMPARE — quick value props, builds intent
          ========================================== */}
      <div className="mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Scale,
              title: 'Side-by-side fees',
              text: 'See exact batch fees, not vague ranges, from both institutes at once.',
            },
            {
              icon: Users,
              title: 'Real student data',
              text: 'Ratings, reviews and verified results — not marketing claims.',
            },
            {
              icon: TrendingUp,
              title: 'Updated regularly',
              text: 'Comparisons refresh as institutes update their fees and facilities.',
            },
          ].map((item: any) => (
            <div key={item.title} className="rounded-2xl border border-stone-200 bg-white p-6">
              <item.icon className="mb-3 h-5 w-5 text-amber-500" />
              <p className="font-bold text-stone-800">{item.title}</p>
              <p className="mt-1 text-sm text-stone-500">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}