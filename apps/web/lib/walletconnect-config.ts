import { mainnet } from "@reown/appkit/networks";
import { UniversalConnector } from "@reown/appkit-universal-connector";
import type { CustomCaipNetwork } from "@reown/appkit-common";

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_PROJECT_ID?.trim() ?? "";

export const walletConnectChainId = "eip155:1";

let universalConnectorPromise: Promise<UniversalConnector> | undefined;

// Explicitly set caipNetworkId and chainNamespace so the library can
// extract a valid CAIP-2 chain ID from this object during init().
const caipMainnet = {
  ...mainnet,
  chainNamespace: "eip155",
  caipNetworkId: "eip155:1",
} as unknown as CustomCaipNetwork;

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
          chains: [caipMainnet],
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
