import {
  BookOpen,
  Building2,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

function formatStat(num: number): string {
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(1)}Cr+`;
  }
  if (num >= 100000) {
    return `${(num / 100000).toFixed(1)}L+`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K+`;
  }
  return num.toString();
}

export default async function HeroStats() {
  // Query DB stats in parallel (published posts, active and published institutes, active categories)
  const [postCount, instituteCount, categoryCount] = await Promise.all([
    prisma.blogPost.count({
      where: { status: "PUBLISHED", visibility: "PUBLIC" },
    }),
    prisma.institute.count({
      where: { isActive: true, isPublished: true },
    }),
    prisma.category.count({
      where: { isActive: true },
    }),
  ]);

  const stats = [
    {
      icon: BookOpen,
      value: formatStat(postCount),
      label: "Articles",
    },
    {
      icon: Building2,
      value: formatStat(instituteCount),
      label: "Institutes",
    },
    {
      icon: GraduationCap,
      value: `${categoryCount}+`,
      label: "Exam Categories",
    },
    {
      icon: TrendingUp,
      value: "Daily",
      label: "Fresh Updates",
    },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-xl"
          >
            <div className="mb-5 inline-flex rounded-2xl bg-amber-50 p-3 text-amber-500 transition-colors group-hover:bg-amber-100">
              <Icon className="h-6 w-6" />
            </div>

            <h3 className="text-3xl font-black tracking-tight text-slate-900">
              {item.value}
            </h3>

            <p className="mt-2 text-sm font-medium text-slate-600">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}