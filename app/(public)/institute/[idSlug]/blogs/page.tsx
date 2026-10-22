import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import extractId from "@/lib/extractId";
import { getInstituteById } from "@/lib/institutes/institutes_id";
import { prisma } from "@/lib/prisma";
import BlogCard from "@/components/blog/cards/BlogCard";
import { BlogCardPost } from "@/types/BlogCard";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ idSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { idSlug } = await params;
  const id = extractId(idSlug);
  const institute = await getInstituteById(id);

  if (!institute) return { title: "Not Found | AcademyFind" };

  return {
    title: `Articles by ${institute.name} | AcademyFind`,
    description: `Read the latest articles and updates from ${institute.name}.`,
  };
}

export default async function InstituteBlogsPage({ params }: PageProps) {
  const { idSlug } = await params;
  const id = extractId(idSlug);

  const institute = await getInstituteById(id);
  if (!institute) notFound();

  const properSlug = institute.slug ? `${institute.id}-${institute.slug}` : institute.id;

  const rawBlogs = await prisma.blogPost.findMany({
    where: { relatedInstituteId: institute.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      coverImageAlt: true,
      readingTime: true,
      publishedAt: true,
      viewCount: true,
      likeCount: true,
      commentCount: true,
      authorProfile: {
        select: {
          displayName: true,
          user: { select: { username: true } },
          avatarUrl: true,
          isVerified: true,
        }
      },
      category: {
        select: { id: true, name: true, slug: true }
      },
      brand: {
        select: { id: true, name: true, slug: true, avatarUrl: true }
      }
    }
  });

  const formattedBlogs: BlogCardPost[] = rawBlogs.map((blog: any) => ({
    ...blog,
    authorProfile: blog.authorProfile ? {
      displayName: blog.authorProfile.displayName,
      username: blog.authorProfile.user.username,
      avatarUrl: blog.authorProfile.avatarUrl,
      isVerified: blog.authorProfile.isVerified,
    } : null,
  }));

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Navigation / Header */}
        <div className="mb-10">
          <Link
            href={`/institute/${properSlug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to {institute.name}
          </Link>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Updates & Articles
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                All articles published by {institute.name}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {formattedBlogs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No articles yet</h3>
            <p className="mt-2 text-slate-500">
              {institute.name} hasn't published any articles yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {formattedBlogs.map((post: any) => (
              <BlogCard key={post.id} post={post as BlogCardPost} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
