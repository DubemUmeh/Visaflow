"use client";
import "@/lib/walletconnect-config";

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}