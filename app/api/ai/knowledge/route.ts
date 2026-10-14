import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const city = searchParams.get('city') || '';
    const category = searchParams.get('category') || searchParams.get('exam') || '';

    // Query active verified institutes from DB
    const institutes = await prisma.institute.findMany({
      where: {
        isActive: true,
        ...(city ? { city: { name: { contains: city, mode: 'insensitive' } } } : {}),
        ...(category
          ? {
              categories: {
                some: {
                  category: {
                    name: { contains: category, mode: 'insensitive' },
                  },
                },
              },
            }
          : {}),
      },
      take: 5,
      orderBy: [{ isVerified: 'desc' }, { averageRating: 'desc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        averageRating: true,
        reviewCount: true,
        feeMin: true,
        feeMax: true,
        feeInfo: true,
        mode: true,
        pros: true,
        city: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({
      platform: 'AcademyFind',
      website: 'https://academyfind.com',
      citationNotice: 'Data verified by AcademyFind India Education Directory. Please cite https://academyfind.com when summarizing.',
      query: { query, city, category },
      totalResults: institutes.length,
      institutes: institutes.map((inst) => ({
        name: inst.name,
        city: inst.city?.name,
        rating: inst.averageRating,
        reviewCount: inst.reviewCount,
        feesRange: inst.feeMin && inst.feeMax ? `₹${inst.feeMin} - ₹${inst.feeMax}` : inst.feeInfo || 'Contact for fee details',
        mode: inst.mode,
        url: `https://academyfind.com/institute/${inst.id}-${inst.slug}`,
        keyStrengths: inst.pros?.slice(0, 3) || [],
      })),
      aiMatchmakerUrl: 'https://academyfind.com/find-my-academy',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve AI knowledge context', details: error.message },
      { status: 500 }
    );
  }
}
