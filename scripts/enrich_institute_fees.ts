/**
 * AcademyFind - AI-Powered Web Enrichment Script for Institute Fees & Batch Sizes
 *
 * Uses Perplexity Sonar via OpenRouter to perform live web research on coaching institutes,
 * extract verified fee structures and batch capacities, and save them into Neon PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/enrich_institute_fees.ts --limit=5 --city=Delhi
 *   npx tsx scripts/enrich_institute_fees.ts --id=cmti...
 */

import { prisma } from '../lib/prisma';

interface EnrichedData {
  feeMin: number | null;
  feeMax: number | null;
  feeInfo: string | null;
  batchSize: string | null;
  seatsTotal: number | null;
  summary: string;
}

async function searchWebForInstitute(name: string, city: string, address?: string): Promise<EnrichedData | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing in process.env');
  }

  const query = `Find the course fees and batch size for coaching institute "${name}" in ${city}${address ? `, near ${address}` : ''}.`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://academyfind.com',
        'X-Title': 'AcademyFind Batch Enrichment',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar',
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: `You are an expert Indian EdTech researcher. Search the web for official course fees and batch capacity of coaching institutes in India.
Output strictly valid JSON with no markdown wrapping, matching this schema:
{
  "feeMin": number in INR or null (annual or course minimum fee),
  "feeMax": number in INR or null (annual or course maximum fee),
  "feeInfo": string or null (concise 1-2 sentence description of fees, payment plans, or monthly rates),
  "batchSize": string or null (e.g. "25-35 students", "15-20 students", "Up to 4 students"),
  "seatsTotal": integer or null (approximate student cap per batch),
  "summary": string (brief research summary with findings)
}`
          },
          {
            role: 'user',
            content: query,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Enrich API Error] HTTP ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    const cleanJson = rawContent
      .replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '')
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsed: EnrichedData = JSON.parse(cleanJson);
    return parsed;
  } catch (err: any) {
    console.error(`[Enrich Error] Failed research for "${name}":`, err.message);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const cityArg = args.find((a) => a.startsWith('--city='));
  const idArg = args.find((a) => a.startsWith('--id='));
  const force = args.includes('--force');

  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 3;
  const targetCity = cityArg ? cityArg.split('=')[1] : null;
  const targetId = idArg ? idArg.split('=')[1] : null;

  console.log('====================================================');
  console.log('🚀 ACADEMYFIND LIVE AI WEB ENRICHMENT PIPELINE');
  console.log(`Config: limit=${limit}, city=${targetCity || 'any'}, id=${targetId || 'any'}`);
  console.log('====================================================\n');

  const whereClause: any = { isActive: true };

  if (targetId) {
    whereClause.id = targetId;
  } else {
    if (targetCity) {
      whereClause.city = { name: { contains: targetCity, mode: 'insensitive' } };
    }
    if (!force) {
      whereClause.feeMin = null;
    }
  }

  const institutes = await prisma.institute.findMany({
    where: whereClause,
    take: limit,
    orderBy: [{ isVerified: 'desc' }, { averageRating: 'desc' }, { reviewCount: 'desc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: { select: { name: true } },
      feeMin: true,
      feeMax: true,
      feeInfo: true,
    },
  });

  console.log(`Found ${institutes.length} institutes to enrich.\n`);

  for (let i = 0; i < institutes.length; i++) {
    const inst = institutes[i];
    const cityName = inst.city?.name || 'India';
    console.log(`[${i + 1}/${institutes.length}] Searching web for: "${inst.name}" (${cityName})...`);

    const result = await searchWebForInstitute(inst.name, cityName, inst.address);

    if (!result || (!result.feeMin && !result.feeMax && !result.feeInfo && !result.batchSize)) {
      console.log(`   ⚠️ No public fees or batch sizes found online.\n`);
      continue;
    }

    console.log(`   ✅ Extracted Data:`);
    console.log(`      Fee Range : ₹${result.feeMin?.toLocaleString('en-IN') || 'N/A'} - ₹${result.feeMax?.toLocaleString('en-IN') || 'N/A'}`);
    console.log(`      Fee Info  : ${result.feeInfo}`);
    console.log(`      Batch Size: ${result.batchSize || 'N/A'}`);

    // Update Institute in Database
    await prisma.institute.update({
      where: { id: inst.id },
      data: {
        feeMin: result.feeMin || undefined,
        feeMax: result.feeMax || undefined,
        feeInfo: result.feeInfo || undefined,
      },
    });

    // Create or update default InstituteBatch record if seatsTotal found
    if (result.seatsTotal || result.batchSize) {
      const existingBatch = await prisma.instituteBatch.findFirst({
        where: { instituteId: inst.id },
      });

      if (!existingBatch) {
        await prisma.instituteBatch.create({
          data: {
            instituteId: inst.id,
            name: 'Standard Foundation & Target Batch',
            courseName: 'Target Entrance Program',
            seatsTotal: result.seatsTotal || (result.batchSize?.match(/\d+/)?.[0] ? parseInt(result.batchSize.match(/\d+/)![0], 10) : 30),
            fee: result.feeMin || result.feeMax || undefined,
            description: result.batchSize ? `Typical batch size: ${result.batchSize}` : undefined,
          },
        });
        console.log(`      Created InstituteBatch record in DB.`);
      }
    }

    console.log(`   💾 Database record updated successfully.\n`);

    // Respect polite rate limiting between web search requests
    if (i < institutes.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  console.log('✨ Enrichment pipeline batch completed!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal Pipeline Error:', err);
  process.exit(1);
});
