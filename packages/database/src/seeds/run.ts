import path from "path";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, sql } from "drizzle-orm";
import {
  countries,
  eligibilityRules,
  visaTypes,
  visaRequirements,
} from "../schema";
import { countriesData } from "./countries.seed";
import { visaTypesData } from "./visa-types.seed";
import { visaRequirementsData } from "./visa-requirements.seed";
import { eligibilityRulesData } from "./eligibility-rules.seed";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:@New$AccOut20$@localhost:5432/visaflow";

type SeedCountryRow = {
  id: string;
  name: string;
  code: string;
  code3: string;
  slug: string;
};

type CoreVisaCategory = {
  key: "TOURISM" | "STUDENT" | "WORK";
  slug: string;
  label: string;
  entryType: "SINGLE" | "MULTIPLE";
  stayDuration: number;
  validityPeriod: number;
  processingDaysMin: number;
  processingDaysMax: number;
  processingDaysExpedited: number;
  processingDaysRush: number;
  govFee: number;
  serviceFee: number;
  sortOrder: number;
};

const coreVisaCategories: CoreVisaCategory[] = [
  {
    key: "TOURISM",
    slug: "tourism",
    label: "Tourism Visa",
    entryType: "SINGLE",
    stayDuration: 30,
    validityPeriod: 90,
    processingDaysMin: 3,
    processingDaysMax: 10,
    processingDaysExpedited: 2,
    processingDaysRush: 1,
    govFee: 6500,
    serviceFee: 3500,
    sortOrder: 100,
  },
  {
    key: "STUDENT",
    slug: "student",
    label: "Student Visa",
    entryType: "MULTIPLE",
    stayDuration: 365,
    validityPeriod: 365,
    processingDaysMin: 10,
    processingDaysMax: 30,
    processingDaysExpedited: 7,
    processingDaysRush: 5,
    govFee: 16000,
    serviceFee: 9000,
    sortOrder: 200,
  },
  {
    key: "WORK",
    slug: "work",
    label: "Work Visa",
    entryType: "MULTIPLE",
    stayDuration: 365,
    validityPeriod: 365,
    processingDaysMin: 15,
    processingDaysMax: 45,
    processingDaysExpedited: 10,
    processingDaysRush: 7,
    govFee: 22000,
    serviceFee: 12000,
    sortOrder: 300,
  },
];

const defaultEligibilityNationalityCodes = [
  "US",
  "GB",
  "CA",
  "AU",
  "IN",
  "CN",
  "NG",
  "BR",
];

const generatedRequirementTemplates: Record<
  CoreVisaCategory["key"],
  Array<{
    documentType: string;
    name: string;
    description: string;
    isRequired: boolean;
    isOptional: boolean;
    helpText: string;
    maxFileSizeMB: number;
    allowedFormats: string[];
  }>
> = {
  TOURISM: [
    {
      documentType: "PASSPORT_COPY",
      name: "Passport Bio-data Page",
      description: "Clear scanned copy of the passport biographical page.",
      isRequired: true,
      isOptional: false,
      helpText:
        "Passport should be valid for at least 6 months beyond the intended stay.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    },
    {
      documentType: "PASSPORT_PHOTO",
      name: "Recent Passport Photo",
      description: "Recent passport-style photo on a plain background.",
      isRequired: true,
      isOptional: false,
      helpText: "Use a clear color photo taken within the last 6 months.",
      maxFileSizeMB: 3,
      allowedFormats: ["jpg", "jpeg", "png"],
    },
    {
      documentType: "FLIGHT_ITINERARY",
      name: "Flight Itinerary",
      description:
        "Round-trip or onward travel itinerary showing planned arrival and departure.",
      isRequired: true,
      isOptional: false,
      helpText:
        "A reservation or itinerary is acceptable unless official instructions require a paid ticket.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    },
    {
      documentType: "HOTEL_BOOKING",
      name: "Accommodation Proof",
      description:
        "Hotel booking, invitation from host, or other proof of accommodation.",
      isRequired: true,
      isOptional: false,
      helpText: "The accommodation proof should cover the intended stay.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    },
    {
      documentType: "BANK_STATEMENT",
      name: "Bank Statement",
      description:
        "Recent bank statement demonstrating sufficient funds for travel.",
      isRequired: true,
      isOptional: false,
      helpText:
        "Upload statements covering the most recent 3 months where available.",
      maxFileSizeMB: 10,
      allowedFormats: ["pdf"],
    },
  ],
  STUDENT: [
    {
      documentType: "PASSPORT_COPY",
      name: "Passport Bio-data Page",
      description: "Clear scanned copy of the passport biographical page.",
      isRequired: true,
      isOptional: false,
      helpText: "Passport should be valid beyond the planned study period.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    },
    {
      documentType: "PASSPORT_PHOTO",
      name: "Recent Passport Photo",
      description: "Recent passport-style photo on a plain background.",
      isRequired: true,
      isOptional: false,
      helpText: "Use a clear color photo taken within the last 6 months.",
      maxFileSizeMB: 3,
      allowedFormats: ["jpg", "jpeg", "png"],
    },
    {
      documentType: "INVITATION_LETTER",
      name: "Admission or Enrollment Letter",
      description:
        "Official admission, enrollment, or acceptance letter from the education provider.",
      isRequired: true,
      isOptional: false,
      helpText:
        "The letter should show the applicant name, program, institution, and study dates.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf"],
    },
    {
      documentType: "FINANCIAL_PROOF",
      name: "Proof of Financial Support",
      description:
        "Evidence of funds or sponsorship for tuition and living costs.",
      isRequired: true,
      isOptional: false,
      helpText:
        "Upload scholarship letters, sponsor letters, or financial statements.",
      maxFileSizeMB: 10,
      allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    },
    {
      documentType: "TRAVEL_INSURANCE",
      name: "Health or Travel Insurance",
      description:
        "Insurance coverage for the intended study period where required.",
      isRequired: false,
      isOptional: true,
      helpText:
        "Recommended for all student travelers and mandatory for some destinations.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf"],
    },
  ],
  WORK: [
    {
      documentType: "PASSPORT_COPY",
      name: "Passport Bio-data Page",
      description: "Clear scanned copy of the passport biographical page.",
      isRequired: true,
      isOptional: false,
      helpText:
        "Passport should be valid beyond the planned work authorization period.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    },
    {
      documentType: "PASSPORT_PHOTO",
      name: "Recent Passport Photo",
      description: "Recent passport-style photo on a plain background.",
      isRequired: true,
      isOptional: false,
      helpText: "Use a clear color photo taken within the last 6 months.",
      maxFileSizeMB: 3,
      allowedFormats: ["jpg", "jpeg", "png"],
    },
    {
      documentType: "EMPLOYMENT_LETTER",
      name: "Employment Offer or Contract",
      description:
        "Signed employment offer, contract, or assignment letter from the sponsoring employer.",
      isRequired: true,
      isOptional: false,
      helpText:
        "The document should include role, employer, salary, and expected start date.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf"],
    },
    {
      documentType: "BUSINESS_REGISTRATION",
      name: "Employer Registration Document",
      description:
        "Business registration or sponsor license document for the employer where applicable.",
      isRequired: false,
      isOptional: true,
      helpText:
        "Upload this if requested by the destination country or sponsor.",
      maxFileSizeMB: 5,
      allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    },
    {
      documentType: "BANK_STATEMENT",
      name: "Bank Statement",
      description: "Recent bank statement or financial support evidence.",
      isRequired: true,
      isOptional: false,
      helpText:
        "Upload statements covering the most recent 3 months where available.",
      maxFileSizeMB: 10,
      allowedFormats: ["pdf"],
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a code→id lookup map from inserted/existing countries */
async function buildCountryMap(
  db: ReturnType<typeof drizzle>,
): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: countries.id, code: countries.code })
    .from(countries);
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.code, row.id);
  }
  return map;
}

async function buildCountryRows(
  db: ReturnType<typeof drizzle>,
): Promise<SeedCountryRow[]> {
  return db
    .select({
      id: countries.id,
      name: countries.name,
      code: countries.code,
      code3: countries.code3,
      slug: countries.slug,
    })
    .from(countries)
    .where(sql`${countries.deletedAt} is null`);
}

function getVisaCode(country: SeedCountryRow, category: CoreVisaCategory) {
  return `${country.code3}_${category.key}_STANDARD`;
}

function getVisaSlug(country: SeedCountryRow, category: CoreVisaCategory) {
  return `${country.slug}-${category.slug}-visa`;
}

async function publishAllCountries(db: ReturnType<typeof drizzle>) {
  console.log("\n📣 Publishing all countries...");

  await db
    .update(countries)
    .set({
      isPublished: true,
      publishedAt: sql`coalesce(${countries.publishedAt}, now())`,
    })
    .where(sql`${countries.deletedAt} is null`);

  console.log("  ✅ all countries are marked as published");
}

// ─── Seeding stages ───────────────────────────────────────────────────────────

async function seedCountries(db: ReturnType<typeof drizzle>) {
  console.log(`\n📍 Inserting ${countriesData.length} countries...`);

  const inserted = await db
    .insert(countries)
    .values(
      countriesData.map((c) => ({
        name: c.name,
        code: c.code,
        code3: c.code3,
        region: c.region,
        subregion: c.subregion,
        flagEmoji: c.flagEmoji,
        phoneCode: c.phoneCode,
        currency: c.currency,
        currencySymbol: c.currencySymbol,
        languages: c.languages,
        slug: c.slug,
        capital: c.capital,
        isPublished: true,
        publishedAt: new Date(),
        visaTypesCount: 0,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: countries.id, code: countries.code });

  console.log(
    `  ✅ ${inserted.length} countries inserted (skipped duplicates)`,
  );
}

async function seedEligibilityRules(
  db: ReturnType<typeof drizzle>,
  countryMap: Map<string, string>,
) {
  console.log(
    `\n🔗 Seeding ${eligibilityRulesData.length} eligibility rules...`,
  );

  let inserted = 0;
  let skipped = 0;

  for (const rule of eligibilityRulesData) {
    const natId = countryMap.get(rule.nat);
    const destId = countryMap.get(rule.dest);

    if (!natId || !destId) {
      console.warn(
        `  ⚠️  Skipping rule ${rule.nat}→${rule.dest}: country not found`,
      );
      skipped++;
      continue;
    }

    const result = await db
      .insert(eligibilityRules)
      .values({
        nationalityCountryId: natId,
        destinationCountryId: destId,
        isVisaRequired: rule.requiresVisa,
        isVisaOnArrival: rule.isVisaOnArrival,
        isEVisa: rule.isEVisa,
        stayDurationDays: rule.stayDays,
        notes: rule.notes ?? null,
        lastVerifiedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: eligibilityRules.id });

    if (result.length > 0) inserted++;
    else skipped++;
  }

  console.log(
    `  ✅ ${inserted} eligibility rules inserted, ${skipped} skipped`,
  );
}

async function seedVisaTypes(
  db: ReturnType<typeof drizzle>,
  countryMap: Map<string, string>,
): Promise<Map<string, string>> {
  console.log(`\n🛂 Seeding ${visaTypesData.length} visa types...`);

  const visaTypeCodeToId = new Map<string, string>();
  let inserted = 0;
  let skipped = 0;

  for (const vt of visaTypesData) {
    const destId = countryMap.get(vt.destinationCountryCode);
    if (!destId) {
      console.warn(
        `  ⚠️  Skipping ${vt.code}: destination ${vt.destinationCountryCode} not found`,
      );
      skipped++;
      continue;
    }

    const natId = vt.nationalityCountryCode
      ? countryMap.get(vt.nationalityCountryCode)
      : null;

    if (vt.nationalityCountryCode && !natId) {
      console.warn(
        `  ⚠️  Skipping ${vt.code}: nationality ${vt.nationalityCountryCode} not found`,
      );
      skipped++;
      continue;
    }

    // Map seed entry types to the enum values Drizzle knows from visa-entry-type enum
    const entryTypeMap: Record<string, "SINGLE" | "MULTIPLE" | "DOUBLE"> = {
      SINGLE: "SINGLE",
      MULTIPLE: "MULTIPLE",
      DOUBLE: "DOUBLE",
      TRANSIT: "SINGLE", // TRANSIT isn't in the enum; treat as single-entry transit visa
    };
    const entryType = entryTypeMap[vt.entryType] ?? "SINGLE";

    const result = await db
      .insert(visaTypes)
      .values({
        name: vt.name,
        code: vt.code,
        slug: vt.slug,
        destinationCountryId: destId,
        nationalityCountryId: natId ?? null,
        entryType,
        stayDuration: vt.stayDuration,
        validityPeriod: vt.validityPeriod,
        description: vt.description,
        notes: vt.notes,
        isVisaRequired: vt.isVisaRequired,
        isVisaOnArrival: vt.isVisaOnArrival,
        isEVisa: vt.isEVisa,
        processingDaysMin: vt.processingDaysMin,
        processingDaysMax: vt.processingDaysMax,
        processingDaysExpedited: vt.processingDaysExpedited ?? null,
        processingDaysRush: vt.processingDaysRush ?? null,
        priceStandard: vt.priceStandard,
        priceExpedited: vt.priceExpedited ?? null,
        priceRush: vt.priceRush ?? null,
        govFee: vt.govFee,
        serviceFee: vt.serviceFee,
        isPublished: vt.isPublished,
        publishedAt: vt.isPublished ? new Date() : null,
        sortOrder: vt.sortOrder,
      })
      .onConflictDoNothing()
      .returning({ id: visaTypes.id, code: visaTypes.code });

    const insertedVisaType = result?.[0];
    if (insertedVisaType) {
      visaTypeCodeToId.set(insertedVisaType.code, insertedVisaType.id);
      inserted++;
    } else {
      // If already exists, fetch the id so requirements can still be linked
      const [existing] = await db
        .select({ id: visaTypes.id })
        .from(visaTypes)
        .where(eq(visaTypes.code, vt.code))
        .limit(1);
      if (existing) visaTypeCodeToId.set(vt.code, existing.id);
      skipped++;
    }
  }

  console.log(
    `  ✅ ${inserted} visa types inserted, ${skipped} skipped/existing`,
  );
  return visaTypeCodeToId;
}

async function ensureCoreVisaTypesForAllCountries(
  db: ReturnType<typeof drizzle>,
  countryRows: SeedCountryRow[],
): Promise<Map<string, string>> {
  const expectedCount = countryRows.length * coreVisaCategories.length;
  console.log(
    `\n🌍 Ensuring ${expectedCount} core work/student/tourism visas across all countries...`,
  );

  const generatedVisaTypeCodeToId = new Map<string, string>();
  let upserted = 0;

  for (const country of countryRows) {
    for (const category of coreVisaCategories) {
      const code = getVisaCode(country, category);
      const priceStandard = category.govFee + category.serviceFee;

      const [row] = await db
        .insert(visaTypes)
        .values({
          name: `${country.name} ${category.label}`,
          code,
          slug: getVisaSlug(country, category),
          destinationCountryId: country.id,
          nationalityCountryId: null,
          entryType: category.entryType,
          stayDuration: category.stayDuration,
          validityPeriod: category.validityPeriod,
          description: `${category.label} for travelers applying to visit ${country.name}.`,
          notes: `Default VisaFlow seed record for ${country.name}; verify country-specific requirements before final submission.`,
          isVisaRequired: true,
          isVisaOnArrival: false,
          isEVisa: true,
          processingDaysMin: category.processingDaysMin,
          processingDaysMax: category.processingDaysMax,
          processingDaysExpedited: category.processingDaysExpedited,
          processingDaysRush: category.processingDaysRush,
          priceStandard,
          priceExpedited: priceStandard + 4500,
          priceRush: priceStandard + 8500,
          govFee: category.govFee,
          serviceFee: category.serviceFee,
          metaTitle: `${country.name} ${category.label} | VisaFlow`,
          metaDescription: `Apply for a ${country.name} ${category.label.toLowerCase()} with VisaFlow.`,
          isPublished: true,
          publishedAt: new Date(),
          sortOrder: category.sortOrder,
        })
        .onConflictDoUpdate({
          target: visaTypes.slug,
          set: {
            name: `${country.name} ${category.label}`,
            destinationCountryId: country.id,
            nationalityCountryId: null,
            entryType: category.entryType,
            stayDuration: category.stayDuration,
            validityPeriod: category.validityPeriod,
            description: `${category.label} for travelers applying to visit ${country.name}.`,
            notes: `Default VisaFlow seed record for ${country.name}; verify country-specific requirements before final submission.`,
            isVisaRequired: true,
            isVisaOnArrival: false,
            isEVisa: true,
            processingDaysMin: category.processingDaysMin,
            processingDaysMax: category.processingDaysMax,
            processingDaysExpedited: category.processingDaysExpedited,
            processingDaysRush: category.processingDaysRush,
            priceStandard,
            priceExpedited: priceStandard + 4500,
            priceRush: priceStandard + 8500,
            govFee: category.govFee,
            serviceFee: category.serviceFee,
            metaTitle: `${country.name} ${category.label} | VisaFlow`,
            metaDescription: `Apply for a ${country.name} ${category.label.toLowerCase()} with VisaFlow.`,
            isPublished: true,
            publishedAt: sql`coalesce(${visaTypes.publishedAt}, now())`,
            sortOrder: category.sortOrder,
          },
        })
        .returning({ id: visaTypes.id, code: visaTypes.code });

      if (row) {
        generatedVisaTypeCodeToId.set(code, row.id);
        upserted++;
      }
    }
  }

  console.log(`  ✅ ${upserted} core visa types inserted/updated`);
  return generatedVisaTypeCodeToId;
}

async function ensureGeneratedVisaRequirements(
  db: ReturnType<typeof drizzle>,
  generatedVisaTypeCodeToId: Map<string, string>,
  countryRows: SeedCountryRow[],
) {
  console.log(
    "\n📑 Ensuring requirements for generated work/student/tourism visas...",
  );

  let inserted = 0;
  let skipped = 0;

  for (const country of countryRows) {
    for (const category of coreVisaCategories) {
      const visaTypeId = generatedVisaTypeCodeToId.get(
        getVisaCode(country, category),
      );
      if (!visaTypeId) {
        skipped += generatedRequirementTemplates[category.key].length;
        continue;
      }

      const templates = generatedRequirementTemplates[category.key];
      for (const [index, requirement] of templates.entries()) {
        const [existing] = await db
          .select({ id: visaRequirements.id })
          .from(visaRequirements)
          .where(
            and(
              eq(visaRequirements.visaTypeId, visaTypeId),
              eq(
                visaRequirements.documentType,
                requirement.documentType as any,
              ),
              eq(visaRequirements.name, requirement.name),
            ),
          )
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        await db.insert(visaRequirements).values({
          visaTypeId,
          documentType: requirement.documentType as any,
          name: requirement.name,
          description: requirement.description,
          isRequired: requirement.isRequired,
          isOptional: requirement.isOptional,
          sortOrder: index + 1,
          helpText: requirement.helpText,
          maxFileSizeMB: requirement.maxFileSizeMB,
          allowedFormats: requirement.allowedFormats,
        });
        inserted++;
      }
    }
  }

  console.log(
    `  ✅ ${inserted} generated visa requirements inserted, ${skipped} already present/skipped`,
  );
}

async function ensureDefaultEligibilityRules(
  db: ReturnType<typeof drizzle>,
  countryRows: SeedCountryRow[],
  countryMap: Map<string, string>,
) {
  console.log(
    "\n🧭 Ensuring default eligibility rules for every destination country...",
  );

  const nationalityIds = defaultEligibilityNationalityCodes
    .map((code) => ({ code, id: countryMap.get(code) }))
    .filter((row): row is { code: string; id: string } => Boolean(row.id));

  let inserted = 0;
  let skipped = 0;

  for (const destination of countryRows) {
    for (const nationality of nationalityIds) {
      if (nationality.id === destination.id) {
        skipped++;
        continue;
      }

      const result = await db
        .insert(eligibilityRules)
        .values({
          nationalityCountryId: nationality.id,
          destinationCountryId: destination.id,
          isVisaRequired: true,
          isVisaOnArrival: false,
          isEVisa: true,
          stayDurationDays: 90,
          notes:
            "Default seed eligibility rule for VisaFlow-published destination visas; confirm official requirements before travel.",
          lastVerifiedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning({ id: eligibilityRules.id });

      if (result.length > 0) inserted++;
      else skipped++;
    }
  }

  console.log(
    `  ✅ ${inserted} default eligibility rules inserted, ${skipped} existing/skipped`,
  );
}

async function seedVisaRequirements(
  db: ReturnType<typeof drizzle>,
  visaTypeCodeToId: Map<string, string>,
) {
  console.log(
    `\n📋 Seeding ${visaRequirementsData.length} visa requirements...`,
  );

  let inserted = 0;
  let skipped = 0;

  for (const req of visaRequirementsData) {
    const vtId = visaTypeCodeToId.get(req.visaTypeCode);
    if (!vtId) {
      console.warn(
        `  ⚠️  Skipping requirement for ${req.visaTypeCode}: visa type not found`,
      );
      skipped++;
      continue;
    }

    const result = await db
      .insert(visaRequirements)
      .values({
        visaTypeId: vtId,
        // Cast to your documentTypeEnum — adjust the enum values to match yours
        documentType: req.documentType as any,
        name: req.name,
        description: req.description,
        isRequired: req.isRequired,
        isOptional: req.isOptional,
        sortOrder: req.sortOrder,
        helpText: req.helpText,
        maxFileSizeMB: req.maxFileSizeMB,
        allowedFormats: req.allowedFormats,
      })
      .onConflictDoNothing()
      .returning({ id: visaRequirements.id });

    if (result.length > 0) inserted++;
    else skipped++;
  }

  console.log(
    `  ✅ ${inserted} visa requirements inserted, ${skipped} skipped`,
  );
}

async function updateVisaTypesCount(
  db: ReturnType<typeof drizzle>,
  countryRows: SeedCountryRow[],
) {
  console.log("\n🔢 Updating visa_types_count on countries...");

  for (const country of countryRows) {
    const rows = (await db
      .select({ count: sql<number>`count(*)` })
      .from(visaTypes)
      .where(
        and(
          eq(visaTypes.destinationCountryId, country.id),
          eq(visaTypes.isPublished, true),
        ),
      )) as any[];

    const count = Number(rows?.[0]?.count ?? 0);

    await db
      .update(countries)
      .set({ visaTypesCount: count })
      .where(eq(countries.id, country.id));
  }

  console.log("  ✅ visa_types_count updated for all countries");
}

// ─── Main entry point ─────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting VisaFlow database seed...");
  console.log(
    "   Connection:",
    connectionString.replace(/:([^@]+)@/, ":****@"),
  );

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // 1. Countries (no dependencies)
    await seedCountries(db);

    // 2. Make every country usable from the public catalog, including existing rows
    await publishAllCountries(db);

    // 3. Build country lookup map (needed by all subsequent steps)
    const countryMap = await buildCountryMap(db);
    const countryRows = await buildCountryRows(db);
    console.log(`\n🗺️  Loaded ${countryMap.size} countries into lookup map`);

    // 4. Curated eligibility rules (depends on countries)
    await seedEligibilityRules(db, countryMap);

    // 5. Curated visa types (depends on countries)
    const visaTypeCodeToId = await seedVisaTypes(db, countryMap);

    // 6. Curated visa requirements (depends on visa types)
    await seedVisaRequirements(db, visaTypeCodeToId);

    // 7. Guaranteed baseline coverage: every country gets published tourism/student/work visas
    const generatedVisaTypeCodeToId = await ensureCoreVisaTypesForAllCountries(
      db,
      countryRows,
    );

    // 8. Generated visa requirements and default eligibility coverage
    await ensureGeneratedVisaRequirements(
      db,
      generatedVisaTypeCodeToId,
      countryRows,
    );
    await ensureDefaultEligibilityRules(db, countryRows, countryMap);

    // 9. Denormalized counts
    await updateVisaTypesCount(db, countryRows);

    console.log("\n🎉 Seed complete!\n");
    console.log("  Summary:");
    console.log(
      `    Countries:                         ${countriesData.length} seeded / ${countryRows.length} total published`,
    );
    console.log(
      `    Curated eligibility rules:          ${eligibilityRulesData.length}`,
    );
    console.log(
      `    Curated visa types:                 ${visaTypesData.length}`,
    );
    console.log(
      `    Curated visa requirements:          ${visaRequirementsData.length}`,
    );
    console.log(
      `    Generated baseline visa types:      ${countryRows.length * coreVisaCategories.length}`,
    );
    console.log(
      `    Generated baseline visa categories: ${coreVisaCategories.map((category) => category.key.toLowerCase()).join(", ")}`,
    );
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

seed();
