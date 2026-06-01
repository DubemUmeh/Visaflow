import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
    'Password must contain uppercase, lowercase, number, and special character',
  );

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  preferredLocale: z.enum(['en', 'es', 'fr', 'pt', 'ar', 'zh']).default('en'),
  nationality: z
    .string()
    .length(2, 'Use ISO 3166-1 alpha-2 country code')
    .toUpperCase()
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const Verify2FASchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
