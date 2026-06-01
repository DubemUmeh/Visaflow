import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DatabaseService } from '../common/database/database.service';
import { VisaTypesService } from '../visa-types/visa-types.service';
import { CACHE_TTL } from '@visaflow/config';
import { and, eq, isNull } from 'drizzle-orm';
import { countries, eligibilityRules } from '@visaflow/database';

export interface EligibilityCheckInput {
  nationalityCode: string;
  destinationCode: string;
  travelPurpose?: string;
}

@Injectable()
export class EligibilityService {
  constructor(
    private readonly dbClient: DatabaseService,
    private readonly visaTypesService: VisaTypesService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async checkEligibility(input: EligibilityCheckInput) {
    const { nationalityCode, destinationCode } = input;
    const cacheKey = `eligibility:${nationalityCode.toUpperCase()}:${destinationCode.toUpperCase()}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [nationalityCountry, destinationCountry] = await Promise.all([
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
        .where(
          and(
            eq(countries.code, nationalityCode.toUpperCase()),
            isNull(countries.deletedAt),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]),
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
        .where(
          and(
            eq(countries.code, destinationCode.toUpperCase()),
            isNull(countries.deletedAt),
          ),
        )
        .limit(1)
        .then((rows) => rows[0]),
    ]);

    if (!nationalityCountry) {
      throw new NotFoundException(`Country not found: ${nationalityCode}`);
    }

    if (!destinationCountry) {
      throw new NotFoundException(`Country not found: ${destinationCode}`);
    }

    const eligibilityRule = await this.dbClient.db
      .select()
      .from(eligibilityRules)
      .where(
        and(
          eq(eligibilityRules.destinationCountryId, destinationCountry.id),
          eq(eligibilityRules.nationalityCountryId, nationalityCountry.id),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);

    const availableVisaTypes = await this.visaTypesService.findByCountryCodes(
      nationalityCode,
      destinationCode,
    );

    const visaTypeSummaries = availableVisaTypes.map((vt) => ({
      id: vt.id,
      name: vt.name,
      slug: vt.slug,
      entryType: vt.entryType,
      stayDuration: vt.stayDuration,
      processingDaysMin: vt.processingDaysMin,
      processingDaysMax: vt.processingDaysMax,
      priceStandard: vt.priceStandard,
      priceExpedited: vt.priceExpedited,
      priceRush: vt.priceRush,
      isEVisa: vt.isEVisa,
      isVisaOnArrival: vt.isVisaOnArrival,
    }));

    const result = {
      nationalityCountry,
      destinationCountry,
      isVisaRequired:
        eligibilityRule?.isVisaRequired ?? availableVisaTypes.length > 0,
      isVisaOnArrival:
        eligibilityRule?.isVisaOnArrival ??
        availableVisaTypes.some((v) => v.isVisaOnArrival),
      isEVisa:
        eligibilityRule?.isEVisa ?? availableVisaTypes.some((v) => v.isEVisa),
      stayDurationDays: eligibilityRule?.stayDurationDays ?? null,
      notes: eligibilityRule?.notes ?? null,
      availableVisaTypes: visaTypeSummaries,
    };

    await this.cache.set(cacheKey, result, CACHE_TTL.LONG);
    return result;
  }

  async getRequirementsForVisaType(visaTypeId: string) {
    const visaType = await this.visaTypesService.findById(visaTypeId);
    return {
      visaType,
      requirements: visaType.requirements_list,
    };
  }
}
