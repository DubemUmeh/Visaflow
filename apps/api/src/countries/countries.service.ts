import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DatabaseService } from '../common/database/database.service';
import { CACHE_TTL } from '@visaflow/config';
import { countries } from '@visaflow/database';
import {
  and,
  asc,
  eq,
  ilike,
  isNotNull,
  isNull,
  or,
  sql,
  type InferModel,
} from 'drizzle-orm';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';

type CountryCreateInput = InferModel<typeof countries, 'insert'>;
type CountryUpdateInput = Partial<InferModel<typeof countries, 'insert'>>;

@Injectable()
export class CountriesService {
  constructor(
    private readonly dbClient: DatabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private cleanInput<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    region?: string;
    isPublished?: boolean;
  }) {
    const { page, limit, search, region, isPublished } = params;
    const cacheKey = `countries:list:${JSON.stringify(params)}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const { skip, take } = buildPaginationSkipTake(page, limit);

    const conditions = [
      isNull(countries.deletedAt),
      isPublished !== undefined
        ? eq(countries.isPublished, isPublished)
        : eq(countries.isPublished, true),
      region ? eq(countries.region, region) : undefined,
      search
        ? or(
            ilike(countries.name, `%${search}%`),
            ilike(countries.code, `%${search}%`),
          )
        : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];

    const where = and(...conditions);

    const [countryRows, countRows] = await Promise.all([
      this.dbClient.db
        .select({
          id: countries.id,
          name: countries.name,
          code: countries.code,
          flagEmoji: countries.flagEmoji,
          slug: countries.slug,
          visaTypesCount: countries.visaTypesCount,
          avgProcessingDays: countries.avgProcessingDays,
        })
        .from(countries)
        .where(where)
        .orderBy(asc(countries.name))
        .limit(take)
        .offset(skip),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(countries)
        .where(where),
    ]);

    const total = Number(countRows[0]?.count ?? 0);
    const result = {
      data: countryRows,
      meta: buildPaginationMeta(total, page, limit),
    };

    await this.cache.set(cacheKey, result, CACHE_TTL.LONG);
    return result;
  }

  async findAllSimple() {
    const cacheKey = 'countries:all-simple:v2';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const countriesList = await this.dbClient.db
      .select({
        id: countries.id,
        name: countries.name,
        code: countries.code,
        flagEmoji: countries.flagEmoji,
        slug: countries.slug,
        visaTypesCount: countries.visaTypesCount,
        avgProcessingDays: countries.avgProcessingDays,
      })
      .from(countries)
      .where(isNull(countries.deletedAt))
      .orderBy(asc(countries.name));

    await this.cache.set(cacheKey, countriesList, CACHE_TTL.VERY_LONG);
    return countriesList;
  }

  async findBySlug(slug: string) {
    const cacheKey = `countries:slug:${slug}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const country = await this.dbClient.db
      .select()
      .from(countries)
      .where(and(eq(countries.slug, slug), isNull(countries.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!country || !country.isPublished) {
      throw new NotFoundException(`Country not found: ${slug}`);
    }

    await this.cache.set(cacheKey, country, CACHE_TTL.LONG);
    return country;
  }

  async findByCode(code: string) {
    return this.dbClient.db
      .select()
      .from(countries)
      .where(
        and(
          eq(countries.code, code.toUpperCase()),
          isNull(countries.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
  }

  async getRegions(): Promise<string[]> {
    const cacheKey = 'countries:regions';
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    const regionsResult = await this.dbClient.db
      .select({ region: countries.region })
      .from(countries)
      .where(
        and(
          isNull(countries.deletedAt),
          eq(countries.isPublished, true),
          isNotNull(countries.region),
        ),
      )
      .groupBy(countries.region)
      .orderBy(asc(countries.region));

    const regions = regionsResult
      .map((r) => r.region)
      .filter(Boolean) as string[];

    await this.cache.set(cacheKey, regions, CACHE_TTL.VERY_LONG);
    return regions;
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async adminCreate(data: CountryCreateInput) {
    const cleaned = this.cleanInput(data);
    const [country] = await this.dbClient.db
      .insert(countries)
      .values(cleaned as CountryCreateInput)
      .returning();

    await this.invalidateCache();
    return country;
  }

  async adminUpdate(id: string, data: CountryUpdateInput) {
    const cleaned = this.cleanInput(data);
    const [country] = await this.dbClient.db
      .update(countries)
      .set(cleaned as CountryUpdateInput)
      .where(eq(countries.id, id))
      .returning();

    await this.invalidateCache();
    return country;
  }

  async adminDelete(id: string) {
    await this.dbClient.db
      .update(countries)
      .set({ deletedAt: new Date() })
      .where(eq(countries.id, id));

    await this.invalidateCache();
  }

  private async invalidateCache() {
    // In production, use cache.store.keys() to pattern-delete
    await this.cache.del('countries:all-simple');
    await this.cache.del('countries:regions');
  }
}
