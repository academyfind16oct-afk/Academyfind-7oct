"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Clock,
  Eye,
  GraduationCap,
  Star,
  Bookmark,
  MapPin,
  PlusCircle,
  PenTool,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { formatIST } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { CompletePublicProfile } from "@/lib/profile/queries";
import { MembershipCard } from "@/app/(public)/u/[username]/components/MembershipCard";
import { PortfolioTab } from "@/app/(public)/u/[username]/components/PortfolioSection";

type Tab = "Dashboard" | "Overview" | "Portfolio" | "Student" | "Teacher" | "Blogs" | "Reviews" | "Activity";

export function ProfileTabs({
  profile,
  isOwnProfile = false,
  privateData = null,
}: {
  profile: any;
  isOwnProfile?: boolean;
  privateData?: any;
}) {
  const TABS: Tab[] = isOwnProfile 
    ? ["Dashboard", "Overview", "Portfolio", "Student", "Teacher", "Blogs", "Reviews", "Activity"] 
    : ["Overview", "Portfolio", "Student", "Teacher", "Blogs", "Reviews", "Activity"];

  const [active, setActive] = useState<Tab>(isOwnProfile ? "Dashboard" : "Overview");

  return (
    <section>
      {/* Tab bar */}
      <div className="mb-5 flex gap-0 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab: Tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActive(tab)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active === tab
                ? "border-amber-400 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === "Dashboard" && isOwnProfile && <DashboardTab privateData={privateData} />}
      {active === "Overview" && <OverviewTab profile={profile} />}
      {active === "Portfolio" && <PortfolioTab profile={profile} isOwnProfile={isOwnProfile} />}
      {active === "Student" && <StudentTab profile={profile} isOwnProfile={isOwnProfile} />}
      {active === "Teacher" && <TeacherTab profile={profile} isOwnProfile={isOwnProfile} />}
      {active === "Blogs" && <BlogsTab profile={profile} isOwnProfile={isOwnProfile} />}
      {active === "Reviews" && <ReviewsTab profile={profile} />}
      {active === "Activity" && <ActivityTab />}
    </section>
  );
}

/* ─── Overview ─────────────────────────────────────────── */
function OverviewTab({ profile }: { profile: any }) {
  const studentMemberships = profile.memberships.filter(
    (m: { role: string }) => m.role === "STUDENT",
  );
  const teacherMemberships = profile.memberships.filter(
    (m: { role: string }) => m.role === "TEACHER",
  );
  const managerMemberships = profile.memberships.filter(
    (m: { role: string }) => m.role === "MANAGER",
  );

  if (!profile.memberships.length) {
    return <Empty text="No institute affiliations yet." />;
  }

  return (
    <div className="space-y-8">
      {studentMemberships.length > 0 && (
        <div>
          <SectionHeader icon={GraduationCap} title="Studying At" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {studentMemberships.map((m: any) => (
              <MembershipCard key={m.id} membership={m} />
            ))}
          </div>
        </div>
      )}
      {teacherMemberships.length > 0 && (
        <div>
          <SectionHeader icon={BookOpen} title="Teaching At" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {teacherMemberships.map((m: any) => (
              <MembershipCard key={m.id} membership={m} />
            ))}
          </div>
        </div>
      )}
      {managerMemberships.length > 0 && (
        <div>
          <SectionHeader icon={Building2} title="Managing" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {managerMemberships.map((m: any) => (
              <MembershipCard key={m.id} membership={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Student ───────────────────────────────────────────── */
function StudentTab({
  profile,
  isOwnProfile,
}: {
  profile: any;
  isOwnProfile: boolean;
}) {
  const sp = profile.studentProfile;
  if (!sp?.isVisible) {
    return (
      <Empty text="Not connected as a student anywhere yet.">
        {isOwnProfile && (
          <Link
            href="/settings/profile"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700"
          >
            Set up student profile <ArrowRight className="size-4" />
          </Link>
        )}
      </Empty>
    );
  }

  const memberships = profile.memberships.filter((m: { role: string }) => m.role === "STUDENT");

  return (
    <div className="space-y-5">
      {/* Global student profile card */}
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          {sp.headline ?? "Student Profile"}
        </h2>
        {sp.bio && (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
            {sp.bio}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {sp.targetExam && (
            <Pill label={`🎯 ${sp.targetExam}`} />
          )}
          {sp.currentClass && (
            <Pill label={`📚 ${sp.currentClass}`} />
          )}
        </div>
      </article>

      {/* Per-institute records */}
      {memberships.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {memberships.map((m: any) => (
            <MembershipCard key={m.id} membership={m} />
          ))}
        </div>
      ) : (
        <Empty text="Not enrolled at any institute yet." />
      )}
    </div>
  );
}

/* ─── Teacher ───────────────────────────────────────────── */
function TeacherTab({
  profile,
  isOwnProfile,
}: {
  profile: any;
  isOwnProfile: boolean;
}) {
  const tp = profile.teacherProfile;
  if (!tp?.isVisible) {
    return (
      <Empty text="No public teacher profile yet.">
        {isOwnProfile && (
          <Link
            href="/settings/profile"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700"
          >
            Set up teacher profile <ArrowRight className="size-4" />
          </Link>
        )}
      </Empty>
    );
  }

  const memberships = profile.memberships.filter((m: { role: string }) => m.role === "TEACHER");

  return (
    <div className="space-y-5">
      {/* Global teacher profile card */}
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">
            {tp.headline ?? "Teacher Profile"}
          </h2>
          {tp.isVerified && (
            <span className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
              ✓ Verified
            </span>
          )}
        </div>
        {tp.bio && (
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
            {tp.bio}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {tp.qualification && <Pill label={`🎓 ${tp.qualification}`} />}
          {tp.experience && <Pill label={`⏱ ${tp.experience}`} />}
        </div>
        {tp.subjects.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Subjects
            </p>
            <div className="flex flex-wrap gap-2">
              {tp.subjects.map((s: string) => (
                <Pill key={s} label={s} color="amber" />
              ))}
            </div>
          </div>
        )}
        {tp.languages.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Languages
            </p>
            <div className="flex flex-wrap gap-2">
              {tp.languages.map((l: string) => (
                <Pill key={l} label={l} />
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Per-institute records */}
      {memberships.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {memberships.map((m: any) => (
            <MembershipCard key={m.id} membership={m} />
          ))}
        </div>
      ) : (
        <Empty text="Not teaching at any institute yet." />
      )}
    </div>
  );
}

/* ─── Blogs ─────────────────────────────────────────────── */
function BlogsTab({
  profile,
  isOwnProfile,
}: {
  profile: any;
  isOwnProfile: boolean;
}) {
  if (!profile.blogs.length) {
    return (
      <Empty text="No published articles yet.">
        {isOwnProfile && (
          <Link
            href="/blog/write"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-700"
          >
            Write an article <ArrowRight className="size-4" />
          </Link>
        )}
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {profile.blogs.map((post: any) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt=""
              width={96}
              height={80}
              className="h-20 w-24 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-2xl">
              ✍️
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-950 line-clamp-2">
              {post.title}
            </p>
            {post.excerpt && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {post.excerpt}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {post.category && (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                  {post.category.name}
                </span>
              )}
              {post.readingTime && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {post.readingTime} min read
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="size-3" /> {post.viewCount} views
              </span>
            </div>
          </div>
        </Link>
      ))}
      <Link
        href={`/u/${profile.username}/blogs`}
        className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-800"
      >
        View all articles <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

/* ─── Reviews ───────────────────────────────────────────── */
function ReviewsTab({ profile }: { profile: any }) {
  if (!profile.reviews.length) {
    return <Empty text="No approved reviews yet." />;
  }

  return (
    <div className="space-y-3">
      {profile.reviews.map((review: any) => (
        <article
          key={review.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            {review.institute.logo ? (
              <Image
                src={review.institute.logo}
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm">
                🏫
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/institute/${review.institute.slug ? `${review.institute.id}-${review.institute.slug}` : review.institute.id}`}
                  className="truncate font-semibold text-slate-900 hover:text-amber-700"
                >
                  {review.institute.name}
                  {review.institute.city && (
                    <span className="font-normal text-slate-500">
                      {" "}
                      · {review.institute.city.name}
                    </span>
                  )}
                </Link>
                <div className="flex shrink-0 gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i: number) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < review.rating ? "fill-amber-400" : "fill-slate-200 text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">
                  {review.comment}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                {review.createdAt.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </article>
      ))}
      <Link
        href={`/u/${profile.username}/reviews`}
        className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-800"
      >
        View all reviews <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

/* ─── Activity (placeholder) ────────────────────────────── */
function ActivityTab() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-2xl">🕐</p>
      <p className="mt-3 font-semibold text-slate-700">Activity feed coming soon</p>
      <p className="mt-1 text-sm text-slate-400">
        Your recent interactions will appear here.
      </p>
    </div>
  );
}

/* ─── Shared helpers ─────────────────────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: typeof GraduationCap;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-5 text-amber-500" />
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
  );
}

function Pill({
  label,
  color = "slate",
}: {
  label: string;
  color?: "slate" | "amber";
}) {
  const styles =
    color === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-sm ${styles}`}
    >
      {label}
    </span>
  );
}

function Empty({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
      <p>{text}</p>
      {children}
    </div>
  );
}

/* ─── Dashboard (Private) ───────────────────────────────── */
function DashboardTab({ privateData }: { privateData: any }) {
  if (!privateData) return null;

  const { canAddInstitute, authorProfile, shortlistedItems, historyItems, managedInstitutes } = privateData;
  const displayShortlist = shortlistedItems.slice(0, 3);
  const displayHistory = historyItems.slice(0, 3);

  return (
    <div className="flex flex-col gap-8 font-sans">
      {canAddInstitute && (
          <Card className="rounded-3xl border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50 via-white to-white overflow-hidden relative border-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-400 rounded-full blur-[80px] opacity-15 pointer-events-none"></div>
              <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                      <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600 shadow-sm"><PlusCircle className="w-5 h-5" /></div>
                      <CardTitle className="text-xl text-emerald-950 font-bold">List Your Academy</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-700 font-medium">
                      Admin has unlocked your specialized one-time pass to create an official institute listing.
                  </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full text-sm text-slate-600 leading-relaxed">
                      Fill out your setup details to deploy your dashboard profile. This form configuration automatically establishes your workspace backend once submitted.
                  </div>
                  <Button asChild className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md px-6 transition-all transform hover:-translate-y-0.5">
                      <Link href="/user/create-institute">
                          Create Listing <ArrowRight className="w-4 h-4" />
                      </Link>
                  </Button>
              </CardContent>
          </Card>
      )}

      {managedInstitutes.length > 0 && (
          <Card className="rounded-3xl border-blue-100 shadow-sm bg-gradient-to-br from-blue-50/50 to-white overflow-hidden relative">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 w-48 h-48 bg-blue-400 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
              <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                      <div className="w-9 h-9 bg-blue-100 rounded-xl text-blue-600 flex items-center justify-center shadow-sm"><Building2 className="w-5 h-5" /></div>
                      <CardTitle className="text-xl">Manager Workspace</CardTitle>
                  </div>
                  <CardDescription>Quick access to the institutes you manage.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full text-sm font-medium text-slate-700">
                      You currently manage <span className="font-bold text-blue-600">{managedInstitutes.length}</span> academy profile(s).
                  </div>
                  <Button asChild className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm">
                      <Link href="/manager">
                          Go to Dashboard <ArrowRight className="w-4 h-4" />
                      </Link>
                  </Button>
              </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-3xl border-slate-100 shadow-sm flex flex-col justify-between">
              <CardHeader className="border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-50 rounded-lg text-red-500"><Bookmark className="w-5 h-5" /></div>
                      <div>
                          <CardTitle className="text-lg">Shortlisted</CardTitle>
                          <CardDescription className="text-xs">Saved institutes</CardDescription>
                      </div>
                  </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-start">
                  {shortlistedItems.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">No saved institutes.</div>
                  ) : (
                      <div className="flex flex-col gap-3 w-full">
                          {displayShortlist.map((item: any) => (
                              <Link key={item.instituteId} href={`/institute/${item.institute.id}-${item.institute.slug}`} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0 mt-1.5"></div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 line-clamp-2 text-wrap leading-snug group-hover:text-amber-600 transition-colors">{item.institute.name}</p>
                                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate"><MapPin className="w-3 h-3 shrink-0"/>{item.institute.city.name}</p>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  )}
              </CardContent>
              {shortlistedItems.length > 3 && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-50 rounded-b-3xl">
                     <Dialog>
                          <DialogTrigger asChild>
                              <Button variant="ghost" className="cursor-pointer w-full text-xs text-amber-600 font-semibold hover:bg-amber-50 rounded-xl justify-between">
                                  View All Saved ({shortlistedItems.length}) <ArrowRight className="w-4 h-4"/>
                              </Button>
                          </DialogTrigger>
                          
                          <DialogContent 
                              className="p-5 bg-white border-slate-100 shadow-2xl outline-none"
                              style={{ width: '92vw', maxWidth: '600px', borderRadius: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }}
                          >
                              <DialogHeader className="text-left mb-2 pr-6">
                                  <DialogTitle className="text-xl font-bold text-slate-800">All Shortlisted Institutes</DialogTitle>
                              </DialogHeader>
                              <div className="flex flex-col gap-3">
                                  {shortlistedItems.map((item: any) => (
                                      <Link 
                                          key={item.instituteId} 
                                          href={`/institute/${item.institute.id}-${item.institute.slug}`} 
                                          className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all group"
                                      >
                                          <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-[15px] text-slate-800 line-clamp-2 text-wrap leading-snug group-hover:text-amber-600 transition-colors">
                                                  {item.institute.name}
                                              </h4>
                                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                                                  <MapPin className="w-3 h-3 shrink-0"/> {item.institute.city.name}
                                              </p>
                                          </div>
                                          <div className="shrink-0 bg-amber-100/50 text-amber-700 px-4 py-2 rounded-full text-xs font-bold group-hover:bg-amber-200/50 transition-colors">
                                              View
                                          </div>
                                      </Link>
                                  ))}
                              </div>
                          </DialogContent>
                      </Dialog>
                  </div>
              )}
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm flex flex-col justify-between">
              <CardHeader className="border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-500"><Clock className="w-5 h-5" /></div>
                      <div>
                          <CardTitle className="text-lg">Recently Visited</CardTitle>
                          <CardDescription className="text-xs">Last 20 views</CardDescription>
                      </div>
                  </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-start">
                  {historyItems.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">Browsing history is clear.</div>
                  ) : (
                      <div className="flex flex-col gap-3 w-full">
                          {displayHistory.map((item: any) => (
                              <Link key={item.id} href={`/institute/${item.institute.id}-${item.institute.slug}`} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0 mt-1.5"></div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 line-clamp-2 text-wrap leading-snug group-hover:text-blue-600 transition-colors">{item.institute.name}</p>
                                      <p className="text-xs text-slate-400 mt-1 truncate"><Clock className="w-3 h-3 inline-block mr-1 shrink-0"/>{formatIST(item.viewedAt, "do MMM, h:mm a")}</p>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  )}
              </CardContent>
              {historyItems.length > 3 && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-50 rounded-b-3xl">
                      <Dialog>
                          <DialogTrigger asChild>
                              <Button variant="ghost" className="cursor-pointer w-full text-xs text-slate-600 font-semibold hover:bg-slate-100 rounded-xl justify-between">
                                  View Browsing History ({historyItems.length}) <ArrowRight className="w-4 h-4"/>
                              </Button>
                          </DialogTrigger>
                          
                          <DialogContent 
                              className="p-5 bg-white border-slate-100 shadow-2xl outline-none"
                              style={{ width: '92vw', maxWidth: '600px', borderRadius: '1.5rem', maxHeight: '85vh', overflowY: 'auto' }}
                          >
                              <DialogHeader className="text-left mb-2 pr-6">
                                  <DialogTitle className="text-xl font-bold text-slate-800">Browsing History</DialogTitle>
                              </DialogHeader>
                              <div className="flex flex-col gap-3">
                                  {historyItems.map((item: any) => (
                                      <Link 
                                          key={item.id} 
                                          href={`/institute/${item.institute.id}-${item.institute.slug}`} 
                                          className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                                      >
                                          <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-[15px] text-slate-800 line-clamp-2 text-wrap leading-snug group-hover:text-blue-600 transition-colors">
                                                  {item.institute.name}
                                              </h4>
                                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                                                  <Clock className="w-3 h-3 shrink-0"/> Visited: {formatIST(item.viewedAt, "PPp")}
                                              </p>
                                          </div>
                                          <div className="shrink-0 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold group-hover:bg-blue-100 transition-colors">
                                              Visit
                                          </div>
                                      </Link>
                                  ))}
                              </div>
                          </DialogContent>
                      </Dialog>
                  </div>
              )}
          </Card>
      </div>

      <Card className="rounded-3xl border-amber-100 shadow-sm bg-gradient-to-br from-amber-50/50 to-white overflow-hidden relative">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-48 h-48 bg-amber-400 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
          <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><PenTool className="w-5 h-5" /></div>
                  <CardTitle className="text-xl">Your Contributions</CardTitle>
                  {authorProfile?.username && (
                      <Button asChild size="sm" variant="outline" className="ml-auto rounded-full border-amber-200 bg-white text-amber-700 hover:bg-amber-50">
                          <Link href={`/blog/author/${authorProfile.username}`}>
                              Author Profile
                          </Link>
                      </Button>
                  )}
              </div>
              <CardDescription>Help other students by sharing your knowledge and experiences.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link href="/blog/write" className="group p-4 rounded-2xl border border-slate-100 bg-white hover:border-amber-200 hover:shadow-md transition-all flex items-start gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors"><FileText className="w-5 h-5" /></div>
                      <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-sm flex items-center justify-between">Write a Blog <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-transform group-hover:translate-x-1" /></h4>
                          <p className="text-xs text-slate-500 mt-1">Share tips, preparation strategies, or your success story.</p>
                      </div>
                  </Link>
                  <Link href="/blog/my-posts" className="group p-4 rounded-2xl border border-slate-100 bg-white hover:border-amber-200 hover:shadow-md transition-all flex items-start gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors"><FileText className="w-5 h-5" /></div>
                      <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 text-sm flex items-center justify-between">My Posts <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-transform group-hover:translate-x-1" /></h4>
                          <p className="text-xs text-slate-500 mt-1">Track drafts, published posts, and everything you have saved.</p>
                      </div>
                  </Link>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
