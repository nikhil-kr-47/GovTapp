import 'dotenv/config';
import { prisma } from '../lib/prisma.js';
import { generateEmbedding } from '../lib/ai.js';

// Helper to prevent hitting rate limits
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function backfillEmbeddings() {
  console.log("Starting backfill for existing tenders without embeddings...");

  // 1. Fetch active tenders that have no embedding
  // (Using raw query because Prisma schema marks embedding as Unsupported)
  const tenders = await prisma.$queryRaw`
    SELECT id, title, department, "referenceNo"
    FROM "Tender"
    WHERE embedding IS NULL
      AND (deadline >= NOW() OR deadline IS NULL)
    ORDER BY "scrapedAt" DESC;
  `;

  console.log(`Found ${tenders.length} tenders needing embeddings.`);

  if (tenders.length === 0) {
    console.log("All active tenders already have embeddings! Nothing to do.");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < tenders.length; i++) {
    const tender = tenders[i];
    const textToEmbed = `${tender.title} - ${tender.department || "Central Government"}`;

    try {
      // 2. Generate 768-dimensional vector
      const vectorValues = await generateEmbedding(textToEmbed);
      const vectorString = JSON.stringify(vectorValues);

      // 3. Save to Neon DB with pgvector cast
      await prisma.$executeRaw`
        UPDATE "Tender"
        SET embedding = ${vectorString}::vector
        WHERE id = ${tender.id}
      `;

      successCount++;
      console.log(`[${i + 1}/${tenders.length}] Saved vector for Ref: ${tender.referenceNo || tender.id}`);
      
      // Polite 250ms pause between Gemini API requests
      await sleep(250);
    } catch (err) {
      failCount++;
      console.error(`[FAILED] Ref: ${tender.referenceNo || tender.id}:`, err.message);
    }
  }

  console.log(`\nBackfill complete! Successfully embedded: ${successCount}, Failed: ${failCount}`);
}

backfillEmbeddings()
  .catch((err) => console.error("Backfill script error:", err))
  .finally(() => prisma.$disconnect());