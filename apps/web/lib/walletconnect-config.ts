"use client";

import type { AppKitNetwork } from "@reown/appkit/networks";
import { mainnet } from "@reown/appkit/networks";
import { UniversalConnector } from "@reown/appkit-universal-connector";
import type { CustomCaipNetwork } from "@reown/appkit-common";

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_PROJECT_ID?.trim() ?? "";

export const walletConnectChain = mainnet as AppKitNetwork;
export const walletConnectChainId = "eip155:1";

let universalConnectorPromise: Promise<UniversalConnector> | undefined;

export function getWalletConnectProjectId() {
  if (!walletConnectProjectId) {
    throw new Error("Missing NEXT_PUBLIC_PROJECT_ID in .env.local.");
  }
  return walletConnectProjectId;
}

export async function getUniversalConnector() {
  if (!universalConnectorPromise) {
    universalConnectorPromise = UniversalConnector.init({
      projectId: getWalletConnectProjectId(),
      metadata: {
        name: "VisaFlow",
        description: "VisaFlow WalletConnect payment checkout",
        url:
          typeof window === "undefined"
            ? "https://visaflow.app"
            : window.location.origin,
        icons: [],
      },
      networks: [
        {
          namespace: "eip155",
          chains: [walletConnectChain as CustomCaipNetwork],
          methods: [
            "eth_sendTransaction",
            "personal_sign",
            "eth_signTypedData",
            "eth_signTypedData_v4",
          ],
          events: ["accountsChanged", "chainChanged", "disconnect"],
        },
      ],
    });
  }

  return universalConnectorPromise;
}
