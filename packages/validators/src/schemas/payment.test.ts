import { describe, expect, it } from "vitest";
import { CreateCheckoutSessionSchema } from "./payment";

describe("CreateCheckoutSessionSchema", () => {
  it.each(["wallet", "paypal"] as const)("accepts %s payments", (provider) => {
    const parsed = CreateCheckoutSessionSchema.parse({
      applicationId: "ee967ea8-868c-4ae6-8f06-38b692e5b012",
      processingTier: "RUSH",
      successUrl: "http://localhost:3000/dashboard/payments/ee967ea8-868c-4ae6-8f06-38b692e5b012?tier=RUSH",
      cancelUrl: "http://localhost:3000/dashboard/applications/ee967ea8-868c-4ae6-8f06-38b692e5b012",
      provider,
    });
    expect(parsed.provider).toBe(provider);
  });
});
