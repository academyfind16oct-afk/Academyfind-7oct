import { Building2, MapPin, Star, Layers3, ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AnimatedCounter from "../User/AnimatedCounter";

export default async function HeroCards() {
  // 1. GLOBAL COUNTS (Ye hamesha total hi rahenge)
  const categoryCount = await prisma.category.count({ where: { isActive: true } });
  const cityCount = await prisma.city.count({ where: { institutes: { some: { isActive: true } } } });

  let instituteCount = 0;
  let avgRating = 0;

    const stats = await prisma.institute.aggregate({
      where: { isActive: true },
      _count: { id: true },
      _avg: { googleRating: true },
    });
    
    instituteCount = stats._count.id;
    avgRating = stats._avg.googleRating || 0;
  

  // 3. DEFINE CARDS DATA (Badge property add kar di hai)
  const statsData: Array<{
    title: string;
    value: number;
    icon: any;
    suffix?: string;
    decimals?: number;
    link?: string;
    format?: "indianCompact" | "standard";
    tooltip?: string;
  }> = [
    { title: "Categories", value: categoryCount, icon: Layers3, suffix: "" , link: "/categories"},
    { 
      title: "Institutes", 
      value: instituteCount, 
      icon: Building2, 
      suffix: "",
      format: "indianCompact",
      tooltip: `${instituteCount.toLocaleString('en-IN')}+ Verified Coaching Institutes`
    },
    { 
      title: "Cities", 
      value: cityCount, 
      icon: MapPin, 
      suffix: "", 
      link: "/cities",
    },
    { title: "Avg Rating", value: avgRating, icon: Star, suffix: "", decimals: 1 },
  ];

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {statsData.map((item) => {
          const Icon = item.icon;

          // Card ka UI Design
          const CardContent = (
            <>
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                {item.link && <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />}
              </div>
              
              {/* Title aur Badge ek sath */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm font-medium">
                  {item.title}
                </p>
              </div>

              <h3 className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
                <AnimatedCounter 
                  value={item.value} 
                  decimals={item.decimals} 
                  suffix={item.suffix} 
                  format={item.format}
                />
              </h3>
            </>
          );

          // Agar Card me 'link' property hai (Yani Cities wala card)
          if (item.link) {
            return (
              <Link
                href={item.link}
                key={item.title}
                prefetch={false}
                title={item.tooltip}
                className="group block rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 cursor-pointer"
              >
                {CardContent}
              </Link>
            );
          }

          // Normal Cards (Bina link wale)
          return (
            <div
              key={item.title}
              title={item.tooltip}
              className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {CardContent}
            </div>
          );
        })}
      </div>
    </section>
  );
}