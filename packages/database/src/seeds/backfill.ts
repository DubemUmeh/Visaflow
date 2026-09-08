// packages/database/src/seed/backfill-categories.ts
import { db } from "../config";
import { visaTypes } from "../schema";
import { eq } from "drizzle-orm";

const CATEGORY_KEYWORDS: Array<[RegExp, string]> = [
  [/tourist|tourism|visit/i, "TOURISM"],
  [/business/i, "BUSINESS"],
  [/student|study/i, "STUDY"],
  [/work|employment/i, "WORK"],
  [/transit/i, "TRANSIT"],
];

async function backfill() {
  const rows = await db
    .select({ id: visaTypes.id, name: visaTypes.name })
    .from(visaTypes);
  let updated = 0;

  for (const row of rows) {
    const match = CATEGORY_KEYWORDS.find(([re]) => re.test(row.name));
    if (match) {
      await db
        .update(visaTypes)
        .set({ category: match[1] as any })
        .where(eq(visaTypes.id, row.id));
      updated++;
    }
  }
  console.log(`Backfilled ${updated} of ${rows.length} visa types.`);
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
