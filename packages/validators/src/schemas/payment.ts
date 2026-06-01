import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  processingTier: z.enum(['STANDARD', 'EXPEDITED', 'RUSH']),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).default('USD'),
  promoCode: z.string().max(50).optional(),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
  provider: z.enum(['stripe', 'paypal']).default('stripe'),
});

export const ApplyPromoCodeSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase().trim(),
  applicationId: z.string().uuid('Invalid application ID'),
});

export const CreatePayPalOrderSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  processingTier: z.enum(['STANDARD', 'EXPEDITED', 'RUSH']),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).default('USD'),
  promoCode: z.string().max(50).optional(),
});

export const CapturePayPalOrderSchema = z.object({
  orderId: z.string().min(1, 'PayPal order ID is required'),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
export type ApplyPromoCodeInput = z.infer<typeof ApplyPromoCodeSchema>;
export type CreatePayPalOrderInput = z.infer<typeof CreatePayPalOrderSchema>;
