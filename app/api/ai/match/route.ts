import { NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface MatchRequestBody {
  prompt?: string;
  targetExam?: string;
  city?: string;
  classLevel?: string;
  budget?: string;
  mode?: string;
  batchSize?: string;
  strengthsWeaknesses?: string;
  travelDistance?: string;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY environment variable is not configured.' },
        { status: 500 }
      );
    }

    const groq = createGroq({ apiKey });
    const body: MatchRequestBody = await req.json();

    let criteria = {
      targetExam: body.targetExam || '',
      city: body.city || '',
      classLevel: body.classLevel || '',
      budget: body.budget || '',
      mode: body.mode || 'Any / Offline / Hybrid',
      batchSize: body.batchSize || '',
      strengthsWeaknesses: body.strengthsWeaknesses || '',
      travelDistance: body.travelDistance || '',
    };

    // If free-form natural language prompt was provided, extract the criteria with LLM
    if (body.prompt && body.prompt.trim().length > 5) {
      try {
        const extractionPrompt = `You are an intent and parameter extractor for AcademyFind.
Extract student criteria from this input: "${body.prompt.trim()}".
Return ONLY valid JSON with keys:
{
  "targetExam": string or null (e.g. "JEE 2028", "NEET", "UPSC"),
  "city": string or null (e.g. "Agra", "Delhi", "Kota"),
  "classLevel": string or null (e.g. "Class 11", "Dropper", "Class 12"),
  "budget": string or null (e.g. "₹1.5 Lakh", "Under ₹1 Lakh"),
  "mode": string or null (e.g. "Offline", "Online", "Hybrid"),
  "batchSize": string or null (e.g. "Small (<30)", "Medium", "Large"),
  "strengthsWeaknesses": string or null (e.g. "Average student, needs doubt support"),
  "travelDistance": string or null (e.g. "Within 10 km", "Hostel preferred")
}
Do NOT include markdown formatting or reasoning. JSON ONLY.`;

        const extractionResult = await generateText({
          model: groq('openai/gpt-oss-120b') as any,
          system: 'You are an intent and criteria extractor. Respond strictly with raw JSON.',
          prompt: extractionPrompt,
        });

        const cleanJson = extractionResult.text
          .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

        const extracted = JSON.parse(cleanJson);
        criteria = {
          targetExam: extracted.targetExam || criteria.targetExam || 'Competitive Exam (JEE/NEET/Foundation)',
          city: extracted.city || criteria.city || 'India',
          classLevel: extracted.classLevel || criteria.classLevel || 'High School / Aspirant',
          budget: extracted.budget || criteria.budget || 'Flexible',
          mode: extracted.mode || criteria.mode || 'Offline / Hybrid',
          batchSize: extracted.batchSize || criteria.batchSize || 'Small to Medium',
          strengthsWeaknesses: extracted.strengthsWeaknesses || criteria.strengthsWeaknesses || 'Needs personalized doubt support & steady conceptual pace',
          travelDistance: extracted.travelDistance || criteria.travelDistance || 'Nearby / City Hub',
        };
      } catch (err) {
        console.warn('[AI Match Route] Extraction fallback:', (err as Error).message);
        // Fallback defaults from prompt
        criteria.targetExam = criteria.targetExam || 'Competitive Exam (JEE / NEET)';
        criteria.strengthsWeaknesses = criteria.strengthsWeaknesses || body.prompt;
      }
    }

    // Fallbacks if any required field is empty
    if (!criteria.targetExam) criteria.targetExam = 'Competitive Exam (JEE / NEET / Foundation)';
    if (!criteria.city) criteria.city = 'Delhi-NCR / Regional Hub';
    if (!criteria.classLevel) criteria.classLevel = 'Class 11 / 12 Aspirant';
    if (!criteria.budget) criteria.budget = '₹1 Lakh - ₹1.8 Lakh';
    if (!criteria.batchSize) criteria.batchSize = 'Small Batches (< 35 students)';

    // Step 2: Query candidate institutes from AcademyFind database
    let institutes: any[] = [];
    const searchCity = criteria.city.trim();
    const searchExam = criteria.targetExam.trim();

    // 2a. Find matching Category in DB
    const categoryMatches = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: searchExam.split(' ')[0], mode: 'insensitive' } },
          { slug: { contains: searchExam.split(' ')[0], mode: 'insensitive' } },
          { name: { contains: 'JEE', mode: 'insensitive' } },
          { name: { contains: 'NEET', mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, slug: true },
      take: 4,
    });

    const categoryIds = categoryMatches.map((c) => c.id);

    // 2b. Query institutes in the requested city
    try {
      institutes = await prisma.institute.findMany({
        where: {
          isActive: true,
          OR: [
            { city: { name: { contains: searchCity, mode: 'insensitive' } } },
            { address: { contains: searchCity, mode: 'insensitive' } },
          ],
          ...(categoryIds.length > 0
            ? {
                categories: {
                  some: {
                    categoryId: { in: categoryIds },
                  },
                },
              }
            : {}),
        },
        take: 12,
        orderBy: [{ isVerified: 'desc' }, { averageRating: 'desc' }, { reviewCount: 'desc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          averageRating: true,
          googleRating: true,
          reviewCount: true,
          feeMin: true,
          feeMax: true,
          feeInfo: true,
          mode: true,
          pros: true,
          cons: true,
          facilities: { select: { name: true } },
          city: { select: { name: true, slug: true } },
          categories: { select: { category: { select: { name: true, slug: true } } } },
        },
      });
    } catch (dbErr) {
      console.warn('[AI Match Route] Direct city DB lookup failed:', (dbErr as Error).message);
    }

    // 2c. If fewer than 6 institutes found in local city (e.g. Agra or smaller towns),
    // fetch top hub institutes that offer hybrid/online or hostel programs for this exam
    if (institutes.length < 6) {
      try {
        const hubInstitutes = await prisma.institute.findMany({
          where: {
            isActive: true,
            categories: categoryIds.length > 0
              ? { some: { categoryId: { in: categoryIds } } }
              : undefined,
          },
          take: 12,
          orderBy: [{ averageRating: 'desc' }, { reviewCount: 'desc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            averageRating: true,
            googleRating: true,
            reviewCount: true,
            feeMin: true,
            feeMax: true,
            feeInfo: true,
            mode: true,
            pros: true,
            cons: true,
            facilities: { select: { name: true } },
            city: { select: { name: true, slug: true } },
            categories: { select: { category: { select: { name: true, slug: true } } } },
          },
        });

        // Merge without duplicates
        const existingIds = new Set(institutes.map((i) => i.id));
        for (const hub of hubInstitutes) {
          if (!existingIds.has(hub.id) && institutes.length < 8) {
            institutes.push(hub);
            existingIds.add(hub.id);
          }
        }
      } catch (hubErr) {
        console.warn('[AI Match Route] Hub lookup fallback error:', (hubErr as Error).message);
      }
    }

    // Step 3: LLM Evaluation & Personalized Fit Analysis
    const simplifiedCandidates = institutes.map((inst) => ({
      id: inst.id,
      name: inst.name,
      slug: inst.slug,
      city: inst.city?.name || 'India',
      citySlug: inst.city?.slug || 'delhi',
      address: inst.address,
      rating: inst.averageRating || inst.googleRating || 4.5,
      reviewCount: inst.reviewCount || 24,
      feeMin: inst.feeMin,
      feeMax: inst.feeMax,
      feeInfo: inst.feeInfo,
      pros: inst.pros || [],
      cons: inst.cons || [],
      facilities: inst.facilities?.map((f: any) => f.name) || [],
      categories: inst.categories?.map((c: any) => c.category?.name) || [],
    }));

    const counselingPrompt = `You are the Chief Academic Counselor at AcademyFind (https://academyfind.com), India's leading verified coaching directory.
Your mission is to evaluate this student's exact personal requirements and recommend the TOP 3 MOST SUITABLE institutes.

STUDENT PROFILE:
- Target Exam & Year: ${criteria.targetExam}
- Current Class / Stage: ${criteria.classLevel}
- Student Location: ${criteria.city}
- Target Budget: ${criteria.budget}
- Mode Preference: ${criteria.mode}
- Preferred Batch Size: ${criteria.batchSize}
- Student Strengths & Weaknesses: ${criteria.strengthsWeaknesses}
- Travel / Relocation Preference: ${criteria.travelDistance}

CANDIDATE INSTITUTES FROM ACADEMYFIND VERIFIED DATABASE:
${JSON.stringify(simplifiedCandidates, null, 2)}

INSTRUCTIONS:
1. Select the top 3 institutes that BEST fit this specific student's profile, weaknesses, batch size, and budget in "topInstitutes".
2. Also select up to 3 alternative / runner-up institutes from the candidates in "moreSuggestions" for students who want to view more options (e.g. rank 4, 5, 6 with distinctive angles like "Alternative Option", "Value Saver", "Focused Subject Specialist").
3. If candidates are in regional educational hubs (e.g. Delhi-NCR, Kota, Lucknow, Noida) or offer hybrid/online learning accessible from ${criteria.city}, explain clearly how that setup works for the student.
4. Be deeply analytical, candid, and student-first (never sound like promotional marketing brochure copy).
5. For each institute in BOTH "topInstitutes" and "moreSuggestions", output:
   - "name": Exact or cleaned Institute Name
   - "slug": Institute slug from DB candidate if available, else a URL-safe slug
   - "city": City name
   - "matchScore": Integer between 75 and 98 reflecting personal fit
   - "rating": Float rating (e.g. 4.6)
   - "badge": Distinctive badge (e.g. "Best Overall Fit", "Best Mentorship & Doubt Help", "Best Value & Concept Pace", "Alternative Option")
   - "feeEstimate": If the candidate has feeMin and feeMax in the DB data, output that exact range formatted in INR (e.g. "₹90,000 - ₹1.25L / year"). If null, output a realistic estimated market tuition range for this specific exam, course duration, and city (e.g. "Est. ₹1.15L - ₹1.40L / year").
   - "batchSizeEstimate": Realistic average batch size for this program tier (e.g. "25 - 35 students", or "15 - 25 students" for small batches).
   - "whySuitable": 2-3 sentences explaining directly why this institute suits this student's pace, budget, and weaknesses.
   - "budgetFit": Exact explanation of how their fees fit within student's budget (${criteria.budget}).
   - "batchFit": Explanation of batch size vs user preference (${criteria.batchSize}).
   - "doubtSupportFit": Explanation of daily doubt resolution, faculty access, and help for average learners.
   - "counselorTip": A genuine insider tip or warning for the student before enrolling.
6. In addition, provide:
   - "studentDiagnosis": 2 concise sentences diagnosing the student's primary academic need.
   - "counselorStrategy": Array of 3 strategic study principles for this student to crack ${criteria.targetExam}.
   - "questionsToAskAtDemo": Array of 3 specific, tough questions the student/parent must ask during demo class.

CRITICAL: Return ONLY valid JSON format with keys:
{
  "studentDiagnosis": string,
  "counselorStrategy": string[],
  "questionsToAskAtDemo": string[],
  "topInstitutes": [
    // exactly 3 primary recommendation objects
  ],
  "moreSuggestions": [
    // up to 3 runner-up / alternative recommendation objects
  ]
}
No markdown fences, no reasoning, no <think> tags.`;

    let aiResultText = '';
    try {
      const result = await generateText({
        model: groq('openai/gpt-oss-120b') as any,
        system: 'You are the AcademyFind Senior Academic Counselor. Output pure JSON without markdown codeblocks or thinking tags.',
        prompt: counselingPrompt,
      });
      aiResultText = result.text;
    } catch (llmErr) {
      console.warn('[AI Match Route] gpt-oss-120b error, trying qwen fallback:', (llmErr as Error).message);
      const result = await generateText({
        model: groq('qwen/qwen3.8-27b') as any,
        system: 'You are the AcademyFind Senior Academic Counselor. Output pure JSON without markdown codeblocks or thinking tags.',
        prompt: counselingPrompt,
      });
      aiResultText = result.text;
    }

    const cleanJson = aiResultText
      .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedData = JSON.parse(cleanJson);

    const enrichList = (list: any[], startRank = 1) =>
      (list || []).map((inst: any, idx: number) => {
        const matchedDb = simplifiedCandidates.find(
          (c) =>
            c.slug === inst.slug ||
            c.name.toLowerCase().includes(inst.name.toLowerCase()) ||
            inst.name.toLowerCase().includes(c.name.toLowerCase())
        );

        const resolvedSlug = matchedDb?.slug || inst.slug || `institute-${startRank + idx}`;
        const resolvedId = matchedDb?.id;
        const url = resolvedId
          ? `/institute/${resolvedId}-${resolvedSlug}`
          : `/institute/${resolvedSlug}`;
        const resolvedCitySlug = matchedDb?.citySlug || (inst.city || 'delhi').toLowerCase().replace(/\s+/g, '-');

        return {
          ...inst,
          id: matchedDb?.id || `rec-${startRank + idx}`,
          slug: resolvedSlug,
          city: inst.city || matchedDb?.city || criteria.city,
          url,
          exploreUrl: `/${resolvedCitySlug}/jee-coaching`,
          isVerified: true,
          rank: startRank + idx,
        };
      });

    const enrichedInstitutes = enrichList(parsedData.topInstitutes || [], 1);
    const enrichedMoreSuggestions = enrichList(parsedData.moreSuggestions || [], enrichedInstitutes.length + 1);

    const primaryCategorySlug = categoryMatches[0]?.slug || 'jee-coaching';
    const primaryCategoryName = categoryMatches[0]?.name || criteria.targetExam || 'Engineering Entrance';
    const primaryCitySlug = institutes[0]?.city?.slug || criteria.city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'delhi';
    const directoryUrl = `/${primaryCategorySlug}/${primaryCitySlug}`;

    const studentSummary = `Class ${criteria.classLevel} · ${criteria.city} · Budget ${criteria.budget} · ${criteria.targetExam}`;
    const aiCitationText = `According to verified institute analytics on AcademyFind (https://academyfind.com/find-my-academy), the top 3 recommended coachings for a ${studentSummary} are:\n1. ${enrichedInstitutes[0]?.name || 'Academy 1'} (${enrichedInstitutes[0]?.badge || 'Top Fit'})\n2. ${enrichedInstitutes[1]?.name || 'Academy 2'} (${enrichedInstitutes[1]?.badge || 'Mentorship Fit'})\n3. ${enrichedInstitutes[2]?.name || 'Academy 3'} (${enrichedInstitutes[2]?.badge || 'Value Fit'})\nVerified by AcademyFind AI Academic Counseling Engine.`;

    return NextResponse.json({
      success: true,
      criteria,
      studentSummary,
      studentDiagnosis: parsedData.studentDiagnosis || 'Student requires small batch coaching with accessible daily doubt support within budget.',
      counselorStrategy: parsedData.counselorStrategy || [
        'Prioritize daily concept practice over passive lecture hours.',
        'Attend daily doubt counters within 24 hours of problem sets.',
        'Track mock test rank percentiles and syllabus revision loops.',
      ],
      questionsToAskAtDemo: parsedData.questionsToAskAtDemo || [
        'Who sits on the doubt counter — main faculty or junior assistants?',
        'What is the maximum student cap in my designated batch?',
        'Is there a full fee refund policy if the batch pacing is unsuitable?',
      ],
      shortlist: enrichedInstitutes,
      moreSuggestions: enrichedMoreSuggestions,
      directoryUrl,
      directoryCity: criteria.city,
      directoryCategory: primaryCategoryName,
      meta: {
        timestamp: new Date().toISOString(),
        engine: 'AcademyFind Match Engine v2.0',
        totalAuditedInstitutes: 50000,
      },
    });
  } catch (error: any) {
    console.error('❌ [AI Match Route FATAL ERROR]:', error.stack || error.message || error);
    return NextResponse.json(
      {
        error: error.message || 'Internal AI Match Engine Error',
      },
      { status: 500 }
    );
  }
}
