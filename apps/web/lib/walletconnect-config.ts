import { createAppKit } from "@reown/appkit/react";
import { mainnet, bsc } from "@reown/appkit/networks";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_PROJECT_ID?.trim() ?? "";

export const walletConnectChainId = "eip155:1";

export function getWalletConnectProjectId() {
  if (!walletConnectProjectId) {
    throw new Error("Missing NEXT_PUBLIC_PROJECT_ID in .env.local.");
  }
  return walletConnectProjectId;
}

// Module-level singleton flag — survives across re-renders/imports within
// the same client bundle instance.
let initialized = false;

if (typeof window !== "undefined" && !initialized) {
  initialized = true;
  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [mainnet, bsc],
    projectId: getWalletConnectProjectId(),
    metadata: {
      name: "VisaFlow",
      description: "VisaFlow WalletConnect payment checkout",
      url: window.location.origin,
      icons: [],
    },
    features: {
      analytics: false,
      socials: false,
      email: false,
    },
  });
}
