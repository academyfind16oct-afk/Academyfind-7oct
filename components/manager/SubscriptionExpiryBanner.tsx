import Link from "next/link";
import { AlertTriangle, ShieldAlert, ArrowRight, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscriptionExpiryBannerProps {
  instituteId: string;
  instituteName: string;
  plan: string;
  planExpiresAt: Date | string | null;
}

export function SubscriptionExpiryBanner({
  instituteId,
  instituteName,
  plan,
  planExpiresAt,
}: SubscriptionExpiryBannerProps) {
  if (!planExpiresAt) return null;

  const expiresAt = new Date(planExpiresAt);
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const formattedDate = expiresAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // State 1: Plan has expired
  if (daysRemaining < 0) {
    return (
      <div className="mb-6 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-rose-50/80 to-red-50/50 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200/60 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-rose-950 text-sm sm:text-base">
                  Subscription Expired ({formattedDate})
                </h4>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                  Benefits Paused
                </span>
              </div>
              <p className="text-xs text-rose-800/90 mt-1 max-w-2xl leading-relaxed">
                Your premium subscription for <strong>{instituteName}</strong> has expired. Direct student enquiries, verified badge, and priority search rankings are currently inactive.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-md text-xs h-9 px-4 shrink-0 transition-transform hover:scale-[1.02]">
            <Link href={`/manager/${instituteId}/subscription`}>
              Renew Plan Now <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // State 2: Plan expiring soon (<= 7 days) and plan is not BASIC
  if (plan !== "BASIC" && daysRemaining <= 7) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50/50 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/60 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              {daysRemaining <= 2 ? <AlertTriangle className="w-5 h-5 text-amber-700" /> : <Clock className="w-5 h-5 text-amber-700" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-amber-950 text-sm sm:text-base">
                  Subscription Expiring Soon ({daysRemaining === 0 ? "Expires Today" : `${daysRemaining} days left`})
                </h4>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  {plan} Plan
                </span>
              </div>
              <p className="text-xs text-amber-900/90 mt-1 max-w-2xl leading-relaxed">
                Your plan expires on <strong>{formattedDate}</strong>. Renew early to prevent interruption to incoming student leads, enquiries, and directory placement.
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-bold rounded-xl shadow-md text-xs h-9 px-4 shrink-0 transition-transform hover:scale-[1.02]">
            <Link href={`/manager/${instituteId}/subscription`}>
              <Sparkles className="w-3.5 h-3.5 mr-1 text-stone-950" />
              Renew Subscription <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
