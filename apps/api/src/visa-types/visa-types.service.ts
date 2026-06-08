import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DatabaseService } from '../common/database/database.service';
import { CACHE_TTL } from '@visaflow/config';
import { countries, visaRequirements, visaTypes } from '@visaflow/database';
import {
  and,
  asc,
  eq,
  gt,
  inArray,
  InferModel,
  isNull,
  isNotNull,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import {
  buildPaginationMeta,
  buildPaginationSkipTake,
} from '../common/dto/pagination.dto';
import {
  CountrySummary,
  VisaRequirementEntity,
  VisaTypeEntity,
} from '@visaflow/shared-types';

type VisaTypeCreateInput = InferModel<typeof visaTypes, 'insert'>;
type VisaTypeUpdateInput = Partial<InferModel<typeof visaTypes, 'insert'>>;

@Injectable()
export class VisaTypesService {
  constructor(
    private readonly dbClient: DatabaseService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  private cleanInput<T extends Record<string, unknown>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as T;
  }

  private serializeDate(value: Date | string | null | undefined) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return value;
    return null;
  }

  private async loadCountrySummary(
    countryId: string,
  ): Promise<CountrySummary | null> {
    const country = await this.dbClient.db
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
      .where(and(eq(countries.id, countryId), isNull(countries.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);

    return country ?? null;
  }

  private async loadRequirements(
    visaTypeIds: string[],
  ): Promise<Record<string, VisaRequirementEntity[]>> {
    if (visaTypeIds.length === 0) return {};

    const rows = await this.dbClient.db
      .select({
        id: visaRequirements.id,
        visaTypeId: visaRequirements.visaTypeId,
        documentType: visaRequirements.documentType,
        name: visaRequirements.name,
        description: visaRequirements.description,
        isRequired: visaRequirements.isRequired,
        isOptional: visaRequirements.isOptional,
        sortOrder: visaRequirements.sortOrder,
        helpText: visaRequirements.helpText,
        exampleUrl: visaRequirements.exampleUrl,
        maxFileSizeMB: visaRequirements.maxFileSizeMB,
        allowedFormats: visaRequirements.allowedFormats,
        createdAt: visaRequirements.createdAt,
        updatedAt: visaRequirements.updatedAt,
      })
      .from(visaRequirements)
      .where(inArray(visaRequirements.visaTypeId, visaTypeIds))
      .orderBy(asc(visaRequirements.sortOrder));

    return rows.reduce<Record<string, VisaRequirementEntity[]>>((acc, row) => {
      const formatted: VisaRequirementEntity = {
        ...row,
        createdAt: this.serializeDate(row.createdAt) ?? '',
        updatedAt: this.serializeDate(row.updatedAt) ?? '',
      };
      const requirements = acc[row.visaTypeId] ?? [];
      requirements.push(formatted);
      acc[row.visaTypeId] = requirements;
      return acc;
    }, {});
  }

  private toCountrySummary(row: CountrySummary) {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      flagEmoji: row.flagEmoji,
      slug: row.slug,
      visaTypesCount: row.visaTypesCount,
      avgProcessingDays: row.avgProcessingDays,
    };
  }

  private toVisaTypeEntity(
    row: InferModel<typeof visaTypes>,
    destinationCountry: CountrySummary,
    nationalityCountry: CountrySummary | null,
    requirementsList: VisaRequirementEntity[],
  ): VisaTypeEntity {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      slug: row.slug,
      destinationCountryId: row.destinationCountryId,
      nationalityCountryId: row.nationalityCountryId,
      entryType: row.entryType,
      stayDuration: row.stayDuration,
      validityPeriod: row.validityPeriod,
      description: row.description,
      requirements: row.requirements,
      notes: row.notes,
      isVisaRequired: row.isVisaRequired,
      isVisaOnArrival: row.isVisaOnArrival,
      isEVisa: row.isEVisa,
      processingDaysMin: row.processingDaysMin,
      processingDaysMax: row.processingDaysMax,
      processingDaysExpedited: row.processingDaysExpedited,
      processingDaysRush: row.processingDaysRush,
      priceStandard: row.priceStandard,
      priceExpedited: row.priceExpedited,
      priceRush: row.priceRush,
      govFee: row.govFee,
      serviceFee: row.serviceFee,
      isPublished: row.isPublished,
      destinationCountry,
      nationalityCountry,
      requirements_list: requirementsList,
      createdAt: this.serializeDate(row.createdAt) ?? '',
      updatedAt: this.serializeDate(row.updatedAt) ?? '',
    };
  }

  private async hydrateVisaTypes(
    rows: InferModel<typeof visaTypes>[],
  ): Promise<VisaTypeEntity[]> {
    const visaTypeIds = rows.map((row) => row.id);
    const requirementsByVisaType = await this.loadRequirements(visaTypeIds);

    const countryIds = rows.flatMap((row) => [
      row.destinationCountryId,
      row.nationalityCountryId,
    ]).filter((id): id is string => !!id);
    const uniqueCountryIds = Array.from(new Set(countryIds));

    const countryRows = await this.dbClient.db
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
      .where(inArray(countries.id, uniqueCountryIds));

    const countryMap = new Map(countryRows.map((row) => [row.id, row]));

    return rows.map((row) => {
      const destinationCountry = countryMap.get(row.destinationCountryId);
      if (!destinationCountry) {
        throw new NotFoundException('Destination country not found');
      }

      const nationalityCountry = row.nationalityCountryId
        ? (countryMap.get(row.nationalityCountryId) ?? null)
        : null;

      return this.toVisaTypeEntity(
        row,
        this.toCountrySummary(destinationCountry),
        nationalityCountry ? this.toCountrySummary(nationalityCountry) : null,
        requirementsByVisaType[row.id] ?? [],
      );
    });
  }

  private async getCountryByCode(code: string) {
    return this.dbClient.db
      .select({ id: countries.id })
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

  async findAll(params: {
    page: number;
    limit: number;
    destinationCountryId?: string;
    destinationCountryCode?: string;
    nationalityCountryId?: string;
    nationalityCountryCode?: string;
    isPublished?: boolean;
  }) {
    const {
      page,
      limit,
      destinationCountryId,
      nationalityCountryId,
      isPublished,
    } = params;
    const { skip, take } = buildPaginationSkipTake(page, limit);

    let destinationCountryFilter = destinationCountryId;
    let nationalityCountryFilter = nationalityCountryId;

    if (params.destinationCountryCode) {
      const country = await this.getCountryByCode(params.destinationCountryCode);
      if (!country) {
        return { data: [], meta: buildPaginationMeta(0, page, limit) };
      }
      destinationCountryFilter = country.id;
    }

    if (params.nationalityCountryCode) {
      const country = await this.getCountryByCode(params.nationalityCountryCode);
      if (!country) {
        return { data: [], meta: buildPaginationMeta(0, page, limit) };
      }
      nationalityCountryFilter = country.id;
    }

    const conditions = [
      isNull(visaTypes.deletedAt),
      isPublished !== undefined
        ? eq(visaTypes.isPublished, isPublished)
        : eq(visaTypes.isPublished, true),
      destinationCountryFilter
        ? eq(visaTypes.destinationCountryId, destinationCountryFilter)
        : undefined,
      nationalityCountryFilter
        ? or(
          eq(visaTypes.nationalityCountryId, nationalityCountryFilter),
          isNull(visaTypes.nationalityCountryId),
        )
        : undefined,
    ].filter(Boolean) as Parameters<typeof and>[0][];

    const where = and(...conditions);

    const [visaTypeRows, countRows] = await Promise.all([
      this.dbClient.db
        .select()
        .from(visaTypes)
        .where(where)
        .orderBy(asc(visaTypes.sortOrder), asc(visaTypes.name))
        .limit(take)
        .offset(skip),
      this.dbClient.db
        .select({ count: sql`count(*)` })
        .from(visaTypes)
        .where(where),
    ]);

    const visaTypesResult = await this.hydrateVisaTypes(visaTypeRows);

    return {
      data: visaTypesResult,
      meta: buildPaginationMeta(Number(countRows[0]?.count ?? 0), page, limit),
    };
  }

  async findBySlug(slug: string) {
    const cacheKey = `visa-type:${slug}`;
    const cached = await this.cache.get<VisaTypeEntity>(cacheKey);
    if (cached) return cached;

    const visaTypeRow = await this.dbClient.db
      .select()
      .from(visaTypes)
      .where(and(eq(visaTypes.slug, slug), isNull(visaTypes.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!visaTypeRow) {
      throw new NotFoundException(`Visa type not found: ${slug}`);
    }

    const visaType = (await this.hydrateVisaTypes([visaTypeRow]))[0];
    if (!visaType || !visaType.isPublished) {
      throw new NotFoundException(`Visa type not found: ${slug}`);
    }

    await this.cache.set(cacheKey, visaType, CACHE_TTL.LONG);
    return visaType;
  }

  async findById(id: string) {
    const visaTypeRow = await this.dbClient.db
      .select()
      .from(visaTypes)
      .where(and(eq(visaTypes.id, id), isNull(visaTypes.deletedAt)))
      .limit(1)
      .then((rows) => rows[0]);

    if (!visaTypeRow) {
      throw new NotFoundException('Visa type not found');
    }

    const [visaType] = await this.hydrateVisaTypes([visaTypeRow]);
    if (!visaType) {
      throw new NotFoundException('Visa type not found');
    }
    return visaType;
  }

  async findByCountryCodes(
    nationalityCode: string,
    destinationCode: string,
  ): Promise<VisaTypeEntity[]> {
    const cacheKey = `visa-types:${nationalityCode.toUpperCase()}-${destinationCode.toUpperCase()}`;
    const cached = await this.cache.get<VisaTypeEntity[]>(cacheKey);
    if (cached) return cached;

    const destinationCountry = await this.getCountryByCode(destinationCode);
    const nationalityCountry = await this.getCountryByCode(nationalityCode);

    if (!destinationCountry) {
      return [];
    }

    const conditions = [
      isNull(visaTypes.deletedAt),
      eq(visaTypes.isPublished, true),
      eq(visaTypes.destinationCountryId, destinationCountry.id),
      or(
        eq(visaTypes.nationalityCountryId, nationalityCountry?.id ?? ''),
        isNull(visaTypes.nationalityCountryId),
      ),
    ].filter(Boolean) as Parameters<typeof and>[0][];

    const visaTypeRows = await this.dbClient.db
      .select()
      .from(visaTypes)
      .where(and(...conditions))
      .orderBy(asc(visaTypes.sortOrder));

    const visaTypesResult = await this.hydrateVisaTypes(visaTypeRows);
    await this.cache.set(cacheKey, visaTypesResult, CACHE_TTL.LONG);
    return visaTypesResult;
  }

  async adminCreate(data: VisaTypeCreateInput) {
    const cleaned = this.cleanInput(data);
    const [created] = await this.dbClient.db
      .insert(visaTypes)
      .values(cleaned)
      .returning({ id: visaTypes.id });

    if (!created) {
      throw new NotFoundException('Visa type not found');
    }

    const visaType = await this.findById(created.id);
    await this.invalidateCache();
    return visaType;
  }

  async adminUpdate(id: string, data: VisaTypeUpdateInput) {
    const cleaned = this.cleanInput(data);
    await this.dbClient.db
      .update(visaTypes)
      .set(cleaned)
      .where(eq(visaTypes.id, id));

    const visaType = await this.findById(id);
    await this.invalidateCache();
    return visaType;
  }

  private async invalidateCache() {
    // Pattern invalidation would be done here in production
  }
}
