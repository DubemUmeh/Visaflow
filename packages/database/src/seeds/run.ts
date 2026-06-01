import path from 'path';
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import { countries, eligibilityRules, visaTypes, visaRequirements } from '../schema';
import { countriesData } from './countries.seed';
import { visaTypesData } from './visa-types.seed';
import { visaRequirementsData } from './visa-requirements.seed';
import { eligibilityRulesData } from './eligibility-rules.seed';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:@New$AccOut20$@localhost:5432/visaflow';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a code→id lookup map from inserted/existing countries */
async function buildCountryMap(
  db: ReturnType<typeof drizzle>
): Promise<Map<string, string>> {
  const rows = await db.select({ id: countries.id, code: countries.code }).from(countries);
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.code, row.id);
  }
  return map;
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
      }))
    )
    .onConflictDoNothing()
    .returning({ id: countries.id, code: countries.code });

  console.log(`  ✅ ${inserted.length} countries inserted (skipped duplicates)`);
}

async function seedEligibilityRules(
  db: ReturnType<typeof drizzle>,
  countryMap: Map<string, string>
) {
  console.log(`\n🔗 Seeding ${eligibilityRulesData.length} eligibility rules...`);

  let inserted = 0;
  let skipped = 0;

  for (const rule of eligibilityRulesData) {
    const natId = countryMap.get(rule.nat);
    const destId = countryMap.get(rule.dest);

    if (!natId || !destId) {
      console.warn(`  ⚠️  Skipping rule ${rule.nat}→${rule.dest}: country not found`);
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

  console.log(`  ✅ ${inserted} eligibility rules inserted, ${skipped} skipped`);
}

async function seedVisaTypes(
  db: ReturnType<typeof drizzle>,
  countryMap: Map<string, string>
): Promise<Map<string, string>> {
  console.log(`\n🛂 Seeding ${visaTypesData.length} visa types...`);

  const visaTypeCodeToId = new Map<string, string>();
  let inserted = 0;
  let skipped = 0;

  for (const vt of visaTypesData) {
    const destId = countryMap.get(vt.destinationCountryCode);
    if (!destId) {
      console.warn(`  ⚠️  Skipping ${vt.code}: destination ${vt.destinationCountryCode} not found`);
      skipped++;
      continue;
    }

    const natId = vt.nationalityCountryCode
      ? countryMap.get(vt.nationalityCountryCode)
      : null;

    if (vt.nationalityCountryCode && !natId) {
      console.warn(`  ⚠️  Skipping ${vt.code}: nationality ${vt.nationalityCountryCode} not found`);
      skipped++;
      continue;
    }

    // Map seed entry types to the enum values Drizzle knows from visa-entry-type enum
    const entryTypeMap: Record<string, 'SINGLE' | 'MULTIPLE' | 'DOUBLE'> = {
      SINGLE: 'SINGLE',
      MULTIPLE: 'MULTIPLE',
      DOUBLE: 'DOUBLE',
      TRANSIT: 'SINGLE', // TRANSIT isn't in the enum; treat as single-entry transit visa
    };
    const entryType = entryTypeMap[vt.entryType] ?? 'SINGLE';

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

  console.log(`  ✅ ${inserted} visa types inserted, ${skipped} skipped/existing`);
  return visaTypeCodeToId;
}

async function seedVisaRequirements(
  db: ReturnType<typeof drizzle>,
  visaTypeCodeToId: Map<string, string>
) {
  console.log(`\n📋 Seeding ${visaRequirementsData.length} visa requirements...`);

  let inserted = 0;
  let skipped = 0;

  for (const req of visaRequirementsData) {
    const vtId = visaTypeCodeToId.get(req.visaTypeCode);
    if (!vtId) {
      console.warn(`  ⚠️  Skipping requirement for ${req.visaTypeCode}: visa type not found`);
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

  console.log(`  ✅ ${inserted} visa requirements inserted, ${skipped} skipped`);
}

async function updateVisaTypesCount(
  db: ReturnType<typeof drizzle>,
  countryMap: Map<string, string>
) {
  console.log('\n🔢 Updating visa_types_count on countries...');

  // For each country that appears as a destination, count its published visa types
  const destCodes = [...new Set(visaTypesData.map((v) => v.destinationCountryCode))];

  for (const code of destCodes) {
    const countryId = countryMap.get(code);
    if (!countryId) continue;

    // Query for count; normalize result safely in case no rows are returned
    const rows = (await db
      .select({ count: db.$count(visaTypes.id) } as any)
      .from(visaTypes)
      .where(and(eq(visaTypes.destinationCountryId, countryId), eq(visaTypes.isPublished, true)))) as any[];

    const count = Number(rows?.[0]?.count ?? 0);

    await db.update(countries).set({ visaTypesCount: count }).where(eq(countries.id, countryId));
  }

  console.log('  ✅ visa_types_count updated');
}

// ─── Main entry point ─────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting VisaFlow database seed...');
  console.log('   Connection:', connectionString.replace(/:([^@]+)@/, ':****@'));

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // 1. Countries (no dependencies)
    await seedCountries(db);

    // 2. Build country lookup map (needed by all subsequent steps)
    const countryMap = await buildCountryMap(db);
    console.log(`\n🗺️  Loaded ${countryMap.size} countries into lookup map`);

    // 3. Eligibility rules (depends on countries)
    await seedEligibilityRules(db, countryMap);

    // 4. Visa types (depends on countries)
    const visaTypeCodeToId = await seedVisaTypes(db, countryMap);

    // 5. Visa requirements (depends on visa types)
    await seedVisaRequirements(db, visaTypeCodeToId);

    // 6. Denormalized counts
    await updateVisaTypesCount(db, countryMap);

    console.log('\n🎉 Seed complete!\n');
    console.log('  Summary:');
    console.log(`    Countries:          ${countriesData.length}`);
    console.log(`    Eligibility rules:  ${eligibilityRulesData.length}`);
    console.log(`    Visa types:         ${visaTypesData.length}`);
    console.log(`    Visa requirements:  ${visaRequirementsData.length}`);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seed();