import { z } from 'zod';

const isoDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => !isNaN(new Date(date).getTime()), 'Invalid date');

export const EligibilityCheckSchema = z.object({
  nationalityCode: z
    .string()
    .length(2, 'Use ISO 3166-1 alpha-2 country code')
    .toUpperCase(),
  destinationCode: z
    .string()
    .length(2, 'Use ISO 3166-1 alpha-2 country code')
    .toUpperCase(),
  travelPurpose: z
    .enum(['TOURISM', 'BUSINESS', 'STUDY', 'MEDICAL', 'TRANSIT'])
    .default('TOURISM'),
});

export const CreateApplicationSchema = z.object({
  visaTypeId: z.string().uuid('Invalid visa type ID'),
  processingTier: z.enum(['STANDARD', 'EXPEDITED', 'RUSH']).default('STANDARD'),
  travelDateFrom: isoDateString.optional(),
  travelDateTo: isoDateString.optional(),
  applicantFirstName: z.string().min(1, 'First name is required').max(100).trim(),
  applicantLastName: z.string().min(1, 'Last name is required').max(100).trim(),
  applicantEmail: z.string().email('Invalid applicant email'),
  applicantPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
  applicantDob: isoDateString.optional(),
  applicantPassportNo: z.string().max(20).optional(),
  applicantPassportExpiry: isoDateString.optional(),
});

export const UpdateApplicationSchema = z.object({
  processingTier: z.enum(['STANDARD', 'EXPEDITED', 'RUSH']).optional(),
  travelDateFrom: isoDateString.optional(),
  travelDateTo: isoDateString.optional(),
  applicantPhone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
  applicantDob: isoDateString.optional(),
  applicantPassportNo: z.string().max(20).optional(),
  applicantPassportExpiry: isoDateString.optional(),
  formData: z.record(z.string(), z.unknown()).optional(),
  currentStep: z.number().int().min(1).optional(),
});

export const SaveDraftSchema = z.object({
  draftData: z.record(z.string(), z.unknown()),
  currentStep: z.number().int().min(1),
});

export const SubmitApplicationSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  finalFormData: z.record(z.string(), z.unknown()),
  agreedToTerms: z.literal(true, {
    message: 'You must agree to the terms and conditions',
  }),
});

// ── Traveler Information Step ────────────────────────────────────────────────

export const TravelerInfoSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  dateOfBirth: isoDateString,
  placeOfBirth: z.string().min(1).max(100),
  nationality: z.string().length(2).toUpperCase(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
  occupation: z.string().min(1).max(100).optional(),
  address: z.object({
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    countryCode: z.string().length(2).toUpperCase(),
  }),
});

// ── Passport Information Step ─────────────────────────────────────────────

export const PassportInfoSchema = z.object({
  passportNumber: z
    .string()
    .min(6, 'Passport number must be at least 6 characters')
    .max(20),
  passportIssueDate: isoDateString,
  passportExpiryDate: isoDateString.refine((date) => {
    const expiry = new Date(date);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expiry > sixMonthsFromNow;
  }, 'Passport must be valid for at least 6 months'),
  passportIssuingCountry: z.string().length(2).toUpperCase(),
  passportIssuingAuthority: z.string().max(200).optional(),
  previousPassportNumber: z.string().max(20).optional(),
});

// ── Travel Details Step ────────────────────────────────────────────────────

export const TravelDetailsSchema = z.object({
  purposeOfVisit: z.enum(['TOURISM', 'BUSINESS', 'STUDY', 'MEDICAL', 'TRANSIT', 'OTHER']),
  intendedArrivalDate: isoDateString,
  intendedDepartureDate: isoDateString,
  portOfEntry: z.string().max(200).optional(),
  accommodationName: z.string().max(200).optional(),
  accommodationAddress: z.string().max(500).optional(),
  fundsAvailable: z.number().min(0).optional(),
  previousVisits: z.number().int().min(0).default(0),
  hasBeenRefused: z.boolean().default(false),
  refusalDetails: z.string().max(1000).optional(),
  emergencyContact: z.object({
    name: z.string().min(1).max(100),
    relationship: z.string().max(50),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    email: z.string().email().optional(),
  }),
});

export type EligibilityCheckInput = z.infer<typeof EligibilityCheckSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type TravelerInfoInput = z.infer<typeof TravelerInfoSchema>;
export type PassportInfoInput = z.infer<typeof PassportInfoSchema>;
export type TravelDetailsInput = z.infer<typeof TravelDetailsSchema>;
