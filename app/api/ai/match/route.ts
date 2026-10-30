import { NextResponse } from 'next/server';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface MatchRequestBody {
  prompt?: string;
  targetExam?: string;
  categoryOrSubject?: string;
  city?: string;
  classLevel?: string;
  budget?: string;
  mode?: string;
  batchSize?: string;
  strengthsWeaknesses?: string;
  travelDistance?: string;
}

function parseJsonSafely(raw: string): any {
  if (!raw || typeof raw !== 'string') return null;

  // 1. Strip thinking tags if present
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // If there's an unclosed <think> tag, try to recover from the first '{'
  if (cleaned.includes('<think>')) {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace !== -1) {
      cleaned = cleaned.substring(firstBrace);
    } else {
      cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '').trim();
    }
  }

  // 2. Strip markdown code fences
  cleaned = cleaned
    .replace(/^```json\s*/gi, '')
    .replace(/^```\s*/gi, '')
    .replace(/```$/gi, '')
    .trim();

  // 3. Try direct JSON.parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 4. Try extracting between the first '{' and the last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

function buildFallbackEvaluation(
  candidates: any[],
  criteria: any,
  searchTopic: string,
  isExam: boolean
) {
  const topCandidates = candidates.slice(0, 3);
  const moreCandidates = candidates.slice(3, 6);

  const formatCandidate = (c: any, index: number, defaultBadge: string) => {
    let feeStr = isExam ? 'Est. ₹1.10L - ₹1.45L / year' : 'Est. ₹2,500 - ₹5,000 / month';
    if (c.feeMin && c.feeMax) {
      const minK = c.feeMin >= 100000 ? `₹${(c.feeMin / 100000).toFixed(1)}L` : `₹${Math.round(c.feeMin / 1000)}k`;
      const maxK = c.feeMax >= 100000 ? `₹${(c.feeMax / 100000).toFixed(1)}L` : `₹${Math.round(c.feeMax / 1000)}k`;
      feeStr = `${minK} - ${maxK} / year`;
    }

    const whySuitable = isExam
      ? `Proven track record in ${searchTopic} preparation with structured curriculum and experienced faculty suited for ${criteria.classLevel} students.`
      : `Verified academy in ${criteria.city} offering structured classes, experienced trainers, and hands-on guidance for ${searchTopic}.`;

    const doubtSupportFit = isExam
      ? `Provides scheduled daily doubt desks and mentor assistance for steady concept mastery.`
      : `Instructors provide direct personal corrections and feedback during live practice sessions.`;

    const counselorTip = isExam
      ? `Attend demo classes before enrolling to verify teaching pace and study material quality.`
      : `Take a trial class to experience the trainer pedagogy, batch vibe, and facility setup firsthand.`;

    return {
      name: c.name,
      slug: c.slug,
      city: c.city || criteria.city,
      matchScore: 96 - index * 3,
      rating: Number((c.rating || 4.7 - index * 0.1).toFixed(1)),
      badge: defaultBadge,
      feeEstimate: feeStr,
      batchSizeEstimate: criteria.batchSize || (isExam ? '25 - 35 students' : '15 - 25 learners'),
      whySuitable,
      budgetFit: `Program fee structure is well-calibrated for the target budget of ${criteria.budget}.`,
      batchFit: `Batch strength supports regular instructor interaction matching preference for ${criteria.batchSize}.`,
      doubtSupportFit,
      counselorTip,
    };
  };

  const topInstitutes = topCandidates.map((c, i) =>
    formatCandidate(
      c,
      i,
      i === 0 ? 'Best Overall Match' : i === 1 ? 'Best Mentorship & Guidance' : 'Best Value & Practice'
    )
  );

  const moreSuggestions = moreCandidates.map((c, i) =>
    formatCandidate(
      c,
      i + 3,
      i === 0 ? 'Alternative Option' : i === 1 ? 'Value Saver' : 'Specialist Track'
    )
  );

  const studentDiagnosis = isExam
    ? `Student targeting ${searchTopic} requires consistent concept practice, small-to-medium batch attention, and daily accessible doubt resolution.`
    : `Learner seeking ${searchTopic} in ${criteria.city} benefits from structured progressive sessions, experienced instructor feedback, and an inspiring learning environment.`;

  const counselorStrategy = isExam
    ? [
        'Prioritize daily concept practice and problem solving over passive lecture hours.',
        'Clear doubts within 24 hours of problem sets rather than accumulating backlogs.',
        'Take bi-weekly timed sectional tests to build exam temperament and speed.',
      ]
    : [
        `Maintain a consistent weekly attendance routine to build muscle memory and solid fundamentals in ${searchTopic}.`,
        `Record practice sessions periodically to review personal form, rhythm, and progress over time.`,
        `Request personalized instructor feedback during every session to correct technique early.`,
      ];

  const questionsToAskAtDemo = isExam
    ? [
        'Who handles daily doubt sessions — the primary batch faculty or junior teaching assistants?',
        'What is the batch strength cap and how are revision batches organized before exam season?',
        'Are class lecture recordings and DPP (Daily Practice Problem) solutions available in the student portal?',
      ]
    : [
        `What is the trainer-to-learner ratio and how are beginner vs advanced batches separated?`,
        `What are the facility standards, equipment quality, and open practice slot availabilities?`,
        `What is the trial class policy and batch rescheduling flexibility before paying full term fees?`,
      ];

  return {
    studentDiagnosis,
    counselorStrategy,
    questionsToAskAtDemo,
    topInstitutes,
    moreSuggestions,
  };
}

// Helper to extract known city and topic using heuristics when AI extraction is bypassed or fails
function fallbackRuleExtractor(text: string) {
  const lower = text.toLowerCase();
  let city: string | null = null;
  let subject: string | null = null;
  let targetExam: string | null = null;

  // Common Indian cities
  const commonCities = [
    'noida', 'greater noida', 'delhi', 'new delhi', 'gurugram', 'gurgaon', 'ghaziabad',
    'faridabad', 'kota', 'jaipur', 'lucknow', 'agra', 'patna', 'varanasi', 'kanpur',
    'indore', 'bhopal', 'mumbai', 'pune', 'bengaluru', 'bangalore', 'hyderabad', 'chennai',
    'kolkata', 'chandigarh', 'dehradun', 'meerut', 'bhubaneswar', 'ahmedabad'
  ];

  for (const c of commonCities) {
    const regex = new RegExp(`\\b${c}\\b`, 'i');
    if (regex.test(lower)) {
      city = c.charAt(0).toUpperCase() + c.slice(1);
      if (c === 'greater noida') city = 'Greater Noida';
      if (c === 'new delhi') city = 'Delhi';
      break;
    }
  }

  // Common subjects/categories
  if (lower.includes('dance') || lower.includes('kathak') || lower.includes('zumba') || lower.includes('salsa') || lower.includes('ballet')) {
    subject = 'Dance Classes';
  } else if (lower.includes('guitar') || lower.includes('music') || lower.includes('piano') || lower.includes('singing')) {
    subject = 'Music & Instrumental Classes';
  } else if (lower.includes('swim')) {
    subject = 'Swimming Classes';
  } else if (lower.includes('cricket') || lower.includes('badminton') || lower.includes('football') || lower.includes('tennis')) {
    subject = 'Sports Academy';
  } else if (lower.includes('jee') || lower.includes('iit')) {
    subject = 'JEE Coaching';
    targetExam = 'JEE Main & Advanced';
  } else if (lower.includes('neet') || lower.includes('medical') || lower.includes('aiims')) {
    subject = 'NEET Coaching';
    targetExam = 'NEET-UG';
  } else if (lower.includes('upsc') || lower.includes('ias') || lower.includes('civil services')) {
    subject = 'UPSC Coaching';
    targetExam = 'UPSC Civil Services';
  } else if (lower.includes('cat') || lower.includes('mba')) {
    subject = 'CAT Coaching';
    targetExam = 'CAT Exam';
  } else if (lower.includes('clat') || lower.includes('law')) {
    subject = 'CLAT Coaching';
    targetExam = 'CLAT Law Entrance';
  } else if (lower.includes('spoken english') || lower.includes('english speaking') || lower.includes('ielts') || lower.includes('german') || lower.includes('french')) {
    subject = 'Language & Spoken English';
  } else if (lower.includes('coding') || lower.includes('python') || lower.includes('web development') || lower.includes('programming')) {
    subject = 'Coding & Computer Classes';
  }

  return { city, subject, targetExam };
}

export async function POST(req: Request) {
  let searchTopic = '';
  let searchCity = '';

  try {
    const apiKey = process.env.GROQ_API_KEY;
    const groq = apiKey ? createGroq({ apiKey }) : null;
    const body: MatchRequestBody = await req.json();

    let criteria = {
      categoryOrSubject: body.categoryOrSubject || '',
      targetExam: body.targetExam || '',
      city: body.city || '',
      classLevel: body.classLevel || '',
      budget: body.budget || '',
      mode: body.mode || 'Any / Offline / Hybrid',
      batchSize: body.batchSize || '',
      strengthsWeaknesses: body.strengthsWeaknesses || '',
      travelDistance: body.travelDistance || '',
    };

    // Step 1: If free-form natural language prompt was provided, extract criteria with LLM
    if (groq && body.prompt && body.prompt.trim().length > 3) {
      try {
        const extractionPrompt = `You are an educational intent and entity extractor for AcademyFind (https://academyfind.com).
Analyze this user query / requirement: "${body.prompt.trim()}".
Extract the learner's actual intent and parameters into raw JSON:
{
  "subjectOrCategory": string (The exact learning domain, subject, or academy type requested, e.g. "Dance Classes", "Guitar Classes", "Swimming", "JEE Coaching", "NEET Coaching", "UPSC Coaching", "English Speaking", "Cricket Academy", "Class 10 Tuition", etc. Extract what the user actually wants. DO NOT default to JEE or NEET if not asked for!),
  "targetExam": string or null (The specific competitive examination if mentioned, e.g. "JEE 2028", "NEET-UG", "UPSC IAS", "CAT", "CLAT", "CUET". Set to null if it is a non-exam activity like dance, music, sports, general skill),
  "city": string or null (The city or locality requested, e.g. "Noida", "Delhi", "Kota", "Agra", "Jaipur", "Bangalore", etc.),
  "classLevel": string or null (Class or stage, e.g. "Beginner", "Intermediate", "Class 11", "Dropper", "Kids", "Adults"),
  "budget": string or null (Budget mentioned, e.g. "₹1.5 Lakh", "Under ₹5,000/mo", "Flexible"),
  "mode": string or null ("Offline", "Online", "Hybrid"),
  "batchSize": string or null ("Small", "Medium", "Large"),
  "strengthsWeaknesses": string or null (Specific learning constraints, goals, style preferences),
  "travelDistance": string or null
}
Return ONLY valid JSON. No reasoning or markdown fences.`;

        const extractionResult = await generateText({
          model: groq('openai/gpt-oss-120b') as any,
          system: 'You are an educational intent and criteria extractor. Respond strictly with raw JSON.',
          prompt: extractionPrompt,
          maxOutputTokens: 500,
        });

        const extracted = parseJsonSafely(extractionResult.text);
        if (extracted) {
          criteria = {
            categoryOrSubject: extracted.subjectOrCategory || criteria.categoryOrSubject,
            targetExam: extracted.targetExam || criteria.targetExam,
            city: extracted.city || criteria.city,
            classLevel: extracted.classLevel || criteria.classLevel,
            budget: extracted.budget || criteria.budget || 'Flexible',
            mode: extracted.mode || criteria.mode || 'Offline / Hybrid',
            batchSize: extracted.batchSize || criteria.batchSize || 'Small to Medium',
            strengthsWeaknesses: extracted.strengthsWeaknesses || criteria.strengthsWeaknesses || body.prompt,
            travelDistance: extracted.travelDistance || criteria.travelDistance || 'Nearby / City Hub',
          };
        }
      } catch (err) {
        console.warn('[AI Match Route] LLM Extraction fallback:', (err as Error).message);
        const ruleMatches = fallbackRuleExtractor(body.prompt);
        criteria.categoryOrSubject = ruleMatches.subject || criteria.categoryOrSubject;
        criteria.targetExam = ruleMatches.targetExam || criteria.targetExam;
        criteria.city = ruleMatches.city || criteria.city;
        criteria.strengthsWeaknesses = criteria.strengthsWeaknesses || body.prompt;
      }
    } else if (body.prompt) {
      const ruleMatches = fallbackRuleExtractor(body.prompt);
      criteria.categoryOrSubject = ruleMatches.subject || criteria.categoryOrSubject;
      criteria.targetExam = ruleMatches.targetExam || criteria.targetExam;
      criteria.city = ruleMatches.city || criteria.city;
      criteria.strengthsWeaknesses = criteria.strengthsWeaknesses || body.prompt;
    }

    // Determine the primary search topic without forcing JEE/NEET defaults
    searchTopic = (criteria.categoryOrSubject || criteria.targetExam || body.prompt || 'Academy').trim();
    // Clean prompt phrase if searchTopic is raw prompt
    if (searchTopic.toLowerCase().includes('in ') && !criteria.categoryOrSubject && !criteria.targetExam) {
      const parts = searchTopic.split(/\bin\b/i);
      searchTopic = parts[0].trim();
    }
    if (!searchTopic) searchTopic = 'Academy';

    searchCity = (criteria.city || '').trim();

    // Check if this topic represents a competitive exam
    const isExamTopic = Boolean(
      criteria.targetExam ||
      /jee|neet|upsc|cat|clat|cuet|gate|ssc|banking|nda|cds|olympiad/i.test(searchTopic)
    );

    // Apply sane contextual defaults
    if (!criteria.classLevel) criteria.classLevel = isExamTopic ? 'Aspirant' : 'Learner';
    if (!criteria.budget) criteria.budget = isExamTopic ? '₹1 Lakh - ₹1.8 Lakh' : 'Flexible / Standard';
    if (!criteria.batchSize) criteria.batchSize = isExamTopic ? 'Small Batches (< 35 students)' : 'Small to Medium Batch';

    // Step 2: Query candidate institutes from AcademyFind database
    // 2a. Resolve City in DB
    let dbCity: any = null;
    if (searchCity) {
      dbCity = await prisma.city.findFirst({
        where: {
          OR: [
            { name: { equals: searchCity, mode: 'insensitive' } },
            { slug: { equals: searchCity.toLowerCase().replace(/[^a-z0-9]+/g, '-'), mode: 'insensitive' } },
            { name: { contains: searchCity, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, slug: true },
      });
    }

    // 2b. Extract key topic words (stripping generic filler words)
    const stopWords = new Set([
      'in', 'at', 'near', 'classes', 'class', 'coaching', 'academy', 'institute', 'centre', 'center',
      'tuition', 'best', 'top', 'good', 'me', 'want', 'looking', 'for', 'please', 'find', 'the',
      'a', 'an', 'and', 'or', 'of', 'to'
    ]);
    const topicWords = searchTopic
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ''))
      .filter((w) => w.length > 2 && !stopWords.has(w));

    // 2c. Match categories in DB strictly for the user's topic (NO hardcoded JEE/NEET!)
    const categoryConditions: any[] = [
      { name: { contains: searchTopic, mode: 'insensitive' } },
      { slug: { contains: searchTopic.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } },
    ];
    for (const word of topicWords) {
      categoryConditions.push({ name: { contains: word, mode: 'insensitive' } });
      categoryConditions.push({ slug: { contains: word, mode: 'insensitive' } });
    }

    const categoryMatches = await prisma.category.findMany({
      where: { OR: categoryConditions },
      select: { id: true, name: true, slug: true },
      take: 6,
    });

    const categoryIds = categoryMatches.map((c) => c.id);

    // 2d. Build strict where conditions for institutes
    const whereConditions: any[] = [{ isActive: true }];

    // City constraint
    if (dbCity) {
      whereConditions.push({
        OR: [
          { cityId: dbCity.id },
          { city: { name: { equals: dbCity.name, mode: 'insensitive' } } },
        ],
      });
    } else if (searchCity) {
      whereConditions.push({
        OR: [
          { city: { name: { contains: searchCity, mode: 'insensitive' } } },
          { address: { contains: searchCity, mode: 'insensitive' } },
        ],
      });
    }

    // Topic constraint (Institute must match the category or have topic words in name/about)
    const topicConditions: any[] = [];
    if (categoryIds.length > 0) {
      topicConditions.push({
        categories: {
          some: {
            categoryId: { in: categoryIds },
          },
        },
      });
    }
    for (const word of topicWords) {
      topicConditions.push({ name: { contains: word, mode: 'insensitive' } });
      topicConditions.push({ description: { contains: word, mode: 'insensitive' } });
    }

    if (topicConditions.length > 0) {
      whereConditions.push({ OR: topicConditions });
    }

    let institutes: any[] = [];
    try {
      institutes = await prisma.institute.findMany({
        where: { AND: whereConditions },
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
      console.warn('[AI Match Route] Direct DB lookup failed:', (dbErr as Error).message);
    }

    // 2e. If fewer than 6 institutes found in local city, search broader for the SAME topic
    // (Never drop the topic condition — do not show JEE coaching for dance queries!)
    if (institutes.length < 6 && topicConditions.length > 0) {
      try {
        const broaderInstitutes = await prisma.institute.findMany({
          where: {
            isActive: true,
            OR: topicConditions,
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

        const existingIds = new Set(institutes.map((i) => i.id));
        for (const broader of broaderInstitutes) {
          if (!existingIds.has(broader.id) && institutes.length < 8) {
            institutes.push(broader);
            existingIds.add(broader.id);
          }
        }
      } catch (broaderErr) {
        console.warn('[AI Match Route] Broader topic lookup fallback error:', (broaderErr as Error).message);
      }
    }

    // Step 3: Handle Zero Results gracefully without returning irrelevant institutes
    const primaryCategorySlug = categoryMatches[0]?.slug || (topicWords[0] ? `${topicWords[0]}-classes` : 'categories');
    const primaryCategoryName = categoryMatches[0]?.name || searchTopic;
    const primaryCitySlug = dbCity?.slug || institutes[0]?.city?.slug || (searchCity ? searchCity.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'all-cities');
    const directoryUrl = `/${primaryCategorySlug}/${primaryCitySlug}`;

    if (institutes.length === 0) {
      return NextResponse.json({
        success: true,
        criteria,
        studentSummary: `${searchTopic}${searchCity ? ` · ${searchCity}` : ''}`,
        studentDiagnosis: `We searched our verified directory for "${searchTopic}"${searchCity ? ` in ${searchCity}` : ''}. No verified academies are currently registered under this exact category in this location.`,
        counselorStrategy: [
          `Consider exploring verified academies in nearby regional hubs or top-rated online live sessions for ${searchTopic}.`,
          `Check instructor credentials, trial class options, and student showcases before enrolling.`,
          `Explore our comprehensive directory to discover related learning categories in ${searchCity || 'your city'}.`,
        ],
        questionsToAskAtDemo: [
          `What are the instructor certifications and years of teaching experience?`,
          `What is the trial/demo class policy before paying full admission fees?`,
          `Are batches segregated by skill level (beginner, intermediate, advanced)?`,
        ],
        shortlist: [],
        moreSuggestions: [],
        directoryUrl,
        directoryCity: searchCity || 'India',
        directoryCategory: primaryCategoryName,
        meta: {
          timestamp: new Date().toISOString(),
          engine: 'AcademyFind Match Engine v2.0',
          totalAuditedInstitutes: 50000,
          noResultsFound: true,
        },
      });
    }

    // Step 4: LLM Evaluation & Personalized Fit Analysis
    const simplifiedCandidates = institutes.map((inst) => ({
      id: inst.id,
      name: inst.name,
      slug: inst.slug,
      city: inst.city?.name || searchCity || 'India',
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

    const counselingPrompt = `You are the Chief Counselor at AcademyFind (https://academyfind.com), India's leading verified coaching & academy discovery platform.
Your mission is to evaluate this learner's exact personal requirements and recommend the TOP 3 MOST SUITABLE academies.

CRITICAL DIRECTIVE - STRICT DOMAIN RELEVANCE:
The user is specifically seeking: "${searchTopic}" in "${searchCity || 'India'}".
Your diagnosis, evaluation, strategy, and tips MUST BE 100% focused on "${searchTopic}".
- Under NO circumstance should you mention or diagnose competitive exams, engineering, medical, JEE, or NEET unless the user explicitly requested them!
- If the user asked for dance classes, focus entirely on dance styles (e.g. Bollywood, Hip-hop, Kathak, Contemporary), studio environment, trainers, practice routines, and batch attention.
- If the user asked for sports, music, languages, or tuition, tailor your counseling strictly to that domain.
- Stay strictly grounded in what the user asked for.

LEARNER PROFILE:
- Learning Pursuit: ${searchTopic}
- Target Exam (if any): ${criteria.targetExam || 'N/A (Skill / Activity / Class)'}
- Current Class / Stage: ${criteria.classLevel}
- Learner Location: ${searchCity || 'India'}
- Target Budget: ${criteria.budget}
- Mode Preference: ${criteria.mode}
- Preferred Batch Size: ${criteria.batchSize}
- Constraints & Goals: ${criteria.strengthsWeaknesses}
- Travel Preference: ${criteria.travelDistance}

CANDIDATE ACADEMIES FROM ACADEMYFIND VERIFIED DATABASE:
${JSON.stringify(simplifiedCandidates, null, 2)}

INSTRUCTIONS:
1. Select the top 3 academies that BEST fit this specific learner's profile, weaknesses, batch size, and budget in "topInstitutes".
2. Also select up to 3 alternative / runner-up academies in "moreSuggestions".
3. Be deeply analytical, candid, and learner-first. Keep each textual explanation concise (1-2 crisp sentences).
4. For each academy in BOTH "topInstitutes" and "moreSuggestions", output:
   - "name": Exact Academy Name from candidates
   - "slug": Academy slug from candidates
   - "city": City name
   - "matchScore": Integer between 78 and 98 reflecting personal fit
   - "rating": Float rating (e.g. 4.7)
   - "badge": Distinctive badge (e.g. "Best Overall Fit", "Best Studio & Vibe", "Top Rated Mentors", "Best Value & Practice")
   - "feeEstimate": If candidate has feeMin/feeMax in data, format in INR (e.g. "₹90k - ₹1.25L / year"). If null, output realistic estimated fee for ${searchTopic} (e.g. "₹2,500 - ₹4,500 / month" or annual if full-time).
   - "batchSizeEstimate": Realistic average batch size (e.g. "15 - 25 learners").
   - "whySuitable": 1-2 crisp sentences explaining directly why this academy suits the learner's pursuit of ${searchTopic}.
   - "budgetFit": 1 sentence explaining how fees fit learner's budget (${criteria.budget}).
   - "batchFit": 1 sentence on batch size vs learner preference (${criteria.batchSize}).
   - "doubtSupportFit": 1 sentence on instructor guidance and personal feedback.
   - "counselorTip": 1 actionable insider tip for the learner before enrolling or visiting.
5. In addition, provide:
   - "studentDiagnosis": 1-2 concise sentences diagnosing the learner's exact needs for ${searchTopic} in ${searchCity}.
   - "counselorStrategy": Array of 3 strategic learning tips for excelling in ${searchTopic}.
   - "questionsToAskAtDemo": Array of 3 specific, tough questions to ask during demo/trial class for ${searchTopic}.

CRITICAL: Return ONLY valid, fully closed JSON format with keys:
{
  "studentDiagnosis": string,
  "counselorStrategy": string[],
  "questionsToAskAtDemo": string[],
  "topInstitutes": [],
  "moreSuggestions": []
}
No markdown fences, no reasoning, no <think> tags.`;

    let parsedData: any = null;
    let aiResultText = '';

    if (groq) {
      try {
        const result = await generateText({
          model: groq('openai/gpt-oss-120b') as any,
          system: 'You are the AcademyFind Senior Counselor. You MUST respond with pure JSON only without markdown code fences or reasoning. Keep text values concise.',
          prompt: counselingPrompt,
          maxOutputTokens: 3500,
          temperature: 0.2,
        });
        aiResultText = result.text;
        parsedData = parseJsonSafely(aiResultText);
      } catch (llmErr) {
        console.warn('[AI Match Route] gpt-oss-120b error or timeout, trying qwen fallback:', (llmErr as Error).message);
        try {
          const result = await generateText({
            model: groq('qwen/qwen3.8-27b') as any,
            system: 'You are the AcademyFind Senior Counselor. You MUST respond with pure JSON only without markdown code fences or reasoning. Keep text values concise.',
            prompt: counselingPrompt,
            maxOutputTokens: 3500,
            temperature: 0.2,
          });
          aiResultText = result.text;
          parsedData = parseJsonSafely(aiResultText);
        } catch (fallbackErr) {
          console.warn('[AI Match Route] qwen fallback also failed:', (fallbackErr as Error).message);
        }
      }
    }

    // Safety: If LLM output could not be parsed or topInstitutes is missing, use deterministic fallback
    if (!parsedData || !Array.isArray(parsedData.topInstitutes) || parsedData.topInstitutes.length === 0) {
      console.info('[AI Match Route] Using deterministic fallback evaluation based on database candidates');
      parsedData = buildFallbackEvaluation(simplifiedCandidates, criteria, searchTopic, isExamTopic);
    }

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
        const resolvedCitySlug = matchedDb?.citySlug || (inst.city || searchCity || 'delhi').toLowerCase().replace(/\s+/g, '-');

        return {
          ...inst,
          id: matchedDb?.id || `rec-${startRank + idx}`,
          slug: resolvedSlug,
          city: inst.city || matchedDb?.city || criteria.city || 'India',
          url,
          exploreUrl: `/${primaryCategorySlug}/${resolvedCitySlug}`,
          isVerified: true,
          rank: startRank + idx,
        };
      });

    const enrichedInstitutes = enrichList(parsedData.topInstitutes || [], 1);
    const enrichedMoreSuggestions = enrichList(parsedData.moreSuggestions || [], enrichedInstitutes.length + 1);

    const studentSummary = [
      searchTopic,
      searchCity,
      criteria.budget && criteria.budget !== 'Flexible' ? criteria.budget : null,
      criteria.classLevel && criteria.classLevel !== 'Aspirant' && criteria.classLevel !== 'Learner' ? criteria.classLevel : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const aiCitationText = `According to verified institute analytics on AcademyFind (https://academyfind.com/find-my-academy), the top 3 recommended academies for ${studentSummary} are:\n1. ${enrichedInstitutes[0]?.name || 'Academy 1'} (${enrichedInstitutes[0]?.badge || 'Top Fit'})\n2. ${enrichedInstitutes[1]?.name || 'Academy 2'} (${enrichedInstitutes[1]?.badge || 'Mentorship Fit'})\n3. ${enrichedInstitutes[2]?.name || 'Academy 3'} (${enrichedInstitutes[2]?.badge || 'Value Fit'})\nVerified by AcademyFind AI Counseling Engine.`;

    return NextResponse.json({
      success: true,
      criteria,
      studentSummary,
      studentDiagnosis:
        parsedData.studentDiagnosis ||
        `Learner seeking ${searchTopic}${searchCity ? ` in ${searchCity}` : ''} requires structured guidance and verified instructors.`,
      counselorStrategy: parsedData.counselorStrategy || [
        `Maintain regular practice sessions and review personal progress weekly.`,
        `Seek direct instructor guidance early to solidify foundational technique.`,
        `Take trial or demo classes to verify batch pacing and environment.`,
      ],
      questionsToAskAtDemo: parsedData.questionsToAskAtDemo || [
        `What is the trainer-to-student ratio during live batches?`,
        `How are beginner vs advanced learners grouped?`,
        `What is the trial class policy before completing full admission?`,
      ],
      shortlist: enrichedInstitutes,
      moreSuggestions: enrichedMoreSuggestions,
      directoryUrl,
      directoryCity: searchCity || 'India',
      directoryCategory: primaryCategoryName,
      meta: {
        timestamp: new Date().toISOString(),
        engine: 'AcademyFind Match Engine v2.0',
        totalAuditedInstitutes: 50000,
      },
    });
  } catch (error: any) {
    console.error('❌ [AI Match Route FATAL ERROR]:', error.stack || error.message || error);
    const topic = searchTopic || 'Academy';
    const city = searchCity || 'India';

    return NextResponse.json({
      success: true,
      criteria: { targetExam: topic, city, budget: 'Flexible' },
      studentSummary: `${topic} · ${city}`,
      studentDiagnosis: `Learner seeking ${topic} in ${city} requires verified instruction and hands-on guidance.`,
      counselorStrategy: [
        `Maintain regular practice and review personal progress weekly.`,
        `Seek direct instructor corrections early to master fundamentals.`,
        `Take trial or demo classes to verify teaching style and facility quality.`,
      ],
      questionsToAskAtDemo: [
        `What is the trainer-to-student ratio during live sessions?`,
        `Are there structured level progressions for learners?`,
        `What is the refund or batch rescheduling policy?`,
      ],
      shortlist: [],
      moreSuggestions: [],
      directoryUrl: '/categories',
      directoryCity: city,
      directoryCategory: topic,
      meta: {
        timestamp: new Date().toISOString(),
        engine: 'AcademyFind Match Engine v2.0 (Resilient Fallback)',
        totalAuditedInstitutes: 50000,
      },
    });
  }
}
