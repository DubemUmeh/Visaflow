// packages/database/src/scripts/run.ts
import { db } from "../config";
import { visaTypes } from "../schema";
import { eq, isNull } from "drizzle-orm";

type VisaCategory =
  "TOURISM" | "BUSINESS" | "STUDY" | "WORK" | "TRANSIT" | "OTHER";

// Order matters: more specific patterns first, since a name could match multiple loosely.
const CATEGORY_PATTERNS: Array<[RegExp, VisaCategory]> = [
  [/transit/i, "TRANSIT"],
  [/student|study|education/i, "STUDY"],
  [/work|employment|labou?r/i, "WORK"],
  [/business|conference|trade/i, "BUSINESS"],
  [/tourist|tourism|visit(or)?|holiday|leisure/i, "TOURISM"],
];

async function run() {
  const rows = await db
    .select({
      id: visaTypes.id,
      name: visaTypes.name,
      category: visaTypes.category,
    })
    .from(visaTypes)
    .where(isNull(visaTypes.deletedAt));

  console.log(`Found ${rows.length} visa types.\n`);

  let matched = 0;
  let unmatched: { id: string; name: string }[] = [];

  for (const row of rows) {
    const hit = CATEGORY_PATTERNS.find(([re]) => re.test(row.name));

    if (!hit) {
      unmatched.push({ id: row.id, name: row.name });
      continue;
    }

    const [, category] = hit;
    if (row.category === category) continue; // already correct, skip the write

    await db
      .update(visaTypes)
      .set({ category })
      .where(eq(visaTypes.id, row.id));
    console.log(`${row.name} -> ${category}`);
    matched++;
  }

  console.log(`\nUpdated: ${matched}`);
  console.log(`Unmatched (left as-is, review manually): ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log("\n--- Unmatched visa names ---");
    unmatched.forEach((u) => console.log(`  [${u.id}] ${u.name}`));
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Run failed:", err);
    process.exit(1);
  });
