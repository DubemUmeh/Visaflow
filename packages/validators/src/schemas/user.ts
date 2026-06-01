import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  nationality: z.string().length(2).toUpperCase().optional().nullable(),
  passportNumber: z.string().max(20).optional().nullable(),
  preferredLocale: z.enum(['en', 'es', 'fr', 'pt', 'ar', 'zh']).optional(),
  timezone: z.string().max(50).optional(),
});

export const CreateSupportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200).trim(),
  body: z.string().min(10, 'Message must be at least 10 characters').max(5000).trim(),
  category: z
    .enum(['general', 'application', 'payment', 'documents', 'technical', 'other'])
    .default('general'),
  applicationId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  guestEmail: z.string().email().optional(),
  guestName: z.string().max(100).optional(),
});

export const ReplyToTicketSchema = z.object({
  body: z.string().min(1, 'Reply cannot be empty').max(5000).trim(),
  attachments: z.array(z.string().url()).max(5).default([]),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateSupportTicketInput = z.infer<typeof CreateSupportTicketSchema>;
export type ReplyToTicketInput = z.infer<typeof ReplyToTicketSchema>;
