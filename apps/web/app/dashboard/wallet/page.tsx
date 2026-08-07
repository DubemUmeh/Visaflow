"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { BalanceCard, DepositStatusBadge, QRCodeCard } from "@/components/wallet/wallet-components";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Wallet = { balance: number; currency: string; depositAddress: { address: string; network: string; asset: string } };
type Transaction = { id: string; type: string; amount: number; balanceAfter: number; description: string; createdAt: string };
type Deposit = { id: string; transactionHash: string; amount: number; status: string; confirmations: number; createdAt: string };

export default function WalletPage() {
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: async () => (await api.get<Wallet>("/wallet")).data });
  const transactions = useQuery({ queryKey: ["wallet-transactions"], queryFn: async () => (await api.get<{ data: Transaction[] }>("/wallet/transactions")).data });
  const deposits = useQuery({ queryKey: ["wallet-deposits"], queryFn: async () => (await api.get<Deposit[]>("/wallet/deposits")).data });

  if (wallet.isLoading) return <div className="p-6">Loading wallet...</div>;
  if (wallet.error || !wallet.data) return <div className="p-6 text-destructive">Unable to load wallet.</div>;

  return <div className="mx-auto max-w-6xl space-y-6 p-6"><div><h1 className="text-3xl font-bold">Wallet</h1><p className="text-muted-foreground">Deposit {wallet.data.depositAddress?.asset} on {wallet.data.depositAddress.network} and pay visa fees from your internal balance.</p></div><div className="grid gap-6 lg:grid-cols-2"><BalanceCard balance={wallet.data.balance} currency={wallet.data.currency} /><QRCodeCard address={wallet.data.depositAddress.address} /></div><Card><CardHeader><CardTitle>Deposits</CardTitle><CardDescription>Pending and completed deposits.</CardDescription></CardHeader><CardContent>{deposits.data?.length ? <div className="space-y-3">{deposits.data.map((deposit) => <div key={deposit.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-mono text-sm">{deposit.transactionHash.slice(0, 18)}...</p><p className="text-sm text-muted-foreground">{deposit.confirmations} confirmations</p></div><DepositStatusBadge status={deposit.status} /></div>)}</div> : <p className="text-muted-foreground">No deposits yet.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Transaction history</CardTitle></CardHeader><CardContent>{transactions.data?.data.length ? <div className="divide-y">{transactions.data.data.map((tx) => <div key={tx.id} className="flex justify-between py-3"><div><p className="font-medium">{tx.description}</p><p className="text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p></div><p className={tx.amount >= 0 ? "text-emerald-600" : "text-destructive"}>{(tx.amount / 100).toFixed(2)}</p></div>)}</div> : <p className="text-muted-foreground">No wallet transactions yet.</p>}</CardContent></Card></div>;
}
