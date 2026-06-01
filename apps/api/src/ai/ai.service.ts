import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { VisaTypesService } from '../visa-types/visa-types.service';
import type {
  AiAutofillDto,
  AiRequirementSummaryDto,
  ChatMessageDto,
} from './dto/ai.dto';

const AUTOFILL_FIELDS = [
  'given_name',
  'family_name',
  'passport_number',
  'passport_expiry',
  'date_of_birth',
  'phone',
  'nationality',
  'address',
  'occupation',
  'purpose_of_visit',
  'intended_entry_date',
  'duration_days',
  'accommodation',
] as const;

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly visaTypesService: VisaTypesService,
  ) {}

  private client() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    return apiKey ? new OpenAI({ apiKey }) : null;
  }

  private model() {
    return this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  private fallbackExtract(prompt: string) {
    const fields: Record<string, string> = {};
    const email = prompt.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    const phone = prompt.match(/\+?[1-9]\d[\d\s\-()]{6,}/)?.[0];
    const passport = prompt.match(/\b[A-Z]{1,3}\d{5,9}\b/i)?.[0];
    const date = prompt.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
    if (email) fields.email = email;
    if (phone) fields.phone = phone.trim();
    if (passport) fields.passport_number = passport.toUpperCase();
    if (date) fields.date_of_birth = date;
    return fields;
  }

  async autofillApplicant(dto: AiAutofillDto) {
    const client = this.client();
    if (!client) {
      return { fields: this.fallbackExtract(dto.prompt), provider: 'fallback' };
    }

    const system = `Extract applicant/passport data for a visa application. Return only JSON with keys: ${AUTOFILL_FIELDS.join(', ')}. Use empty strings for unknown values. Visa: ${dto.visaName}.`;
    const completion = await client.chat.completions.create({
      model: this.model(),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: dto.prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      parsed = {};
    }

    const fields: Record<string, string> = {};
    for (const field of AUTOFILL_FIELDS) {
      const value = parsed[field];
      if (typeof value === 'string' && value.trim()) fields[field] = value.trim();
    }
    return { fields, provider: 'openai' };
  }

  async requirementSummary(dto: AiRequirementSummaryDto) {
    const visaType = await this.visaTypesService.findById(dto.visaTypeId);
    const fallback = {
      summary: `${visaType.name} requires clear applicant details, passport information, and any supporting documents requested for ${dto.nationalityCode.toUpperCase()} travelers.`,
      keyPoints: [
        'Use passport details exactly as printed.',
        'Upload clear, unexpired documents.',
        'Travel dates should match your booking evidence.',
      ],
      commonMistakes: ['Blurry passport scans', 'Mismatched names', 'Expired documents'],
      tips: ['Apply early and keep copies of every submitted document.'],
    };

    const client = this.client();
    if (!client) return fallback;

    const completion = await client.chat.completions.create({
      model: this.model(),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Return JSON with summary, keyPoints, commonMistakes, tips for a visa application. Arrays should contain concise strings.',
        },
        {
          role: 'user',
          content: `Visa: ${visaType.name}. Requirements: ${visaType.requirements ?? 'Not specified'}. Nationality: ${dto.nationalityCode}.`,
        },
      ],
    });

    try {
      return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
    } catch {
      return fallback;
    }
  }

  async chat(dto: ChatMessageDto) {
    const client = this.client();
    if (!client) {
      return {
        message:
          'I can help with visa requirements, document preparation, and application status. AI is not configured, so this is a basic assistant response.',
        conversationId: dto.conversationId ?? crypto.randomUUID(),
        suggestions: ['Check eligibility', 'Review required documents', 'Contact support'],
      };
    }

    const completion = await client.chat.completions.create({
      model: this.model(),
      messages: [
        {
          role: 'system',
          content:
            'You are VisaFlow support AI. Give concise, practical visa application guidance. Do not provide legal guarantees.',
        },
        { role: 'user', content: dto.message },
      ],
    });

    return {
      message: completion.choices[0]?.message?.content ?? 'I could not generate a response.',
      conversationId: dto.conversationId ?? crypto.randomUUID(),
      suggestions: ['Upload documents', 'Check application status', 'Talk to support'],
      applicationId: dto.applicationId,
    };
  }
}
