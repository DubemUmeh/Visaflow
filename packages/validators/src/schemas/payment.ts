import { z } from "zod";

export const CreateCheckoutSessionSchema = z.object({
  applicationId: z.string().uuid(),
  processingTier: z.enum(["STANDARD", "EXPEDITED", "RUSH"]),
  currency: z.string().min(3).max(3).optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  provider: z.enum(["wallet", "paypal"]).optional(),
});

export const CreatePayPalOrderSchema = z.object({
  paymentId: z.string().uuid(),
});

export const CapturePayPalOrderSchema = z.object({
  orderId: z.string().min(1, "PayPal order ID is required"),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
export type CreatePayPalOrderInput = z.infer<typeof CreatePayPalOrderSchema>;
export type CapturePayPalOrderInput = z.infer<typeof CapturePayPalOrderSchema>;
