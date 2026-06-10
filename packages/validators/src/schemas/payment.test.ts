import { describe, expect, it } from "vitest";
import { CreateCheckoutSessionSchema } from "./payment";

const validCheckout = {
  applicationId: "ee967ea8-868c-4ae6-8f06-38b692e5b012",
  processingTier: "RUSH" as const,
  successUrl:
    "http://localhost:3000/dashboard/applications/ee967ea8-868c-4ae6-8f06-38b692e5b012",
  cancelUrl:
    "http://localhost:3000/dashboard/payments/ee967ea8-868c-4ae6-8f06-38b692e5b012?tier=RUSH",
};

describe("CreateCheckoutSessionSchema", () => {
  it.each(["crypto_wallet_connect", "crypto_wallet_address"] as const)(
    "accepts %s checkout requests",
    (provider) => {
      const parsed = CreateCheckoutSessionSchema.parse({
        ...validCheckout,
        provider,
        walletId: "usdt-erc20",
      });

      expect(parsed.provider).toBe(provider);
      expect(parsed.walletId).toBe("usdt-erc20");
    },
  );
});
