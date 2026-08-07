"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BalanceCard({
  balance,
  currency,
}: {
  balance: number;
  currency: string;
}) {
  const safeBalance = Number.isFinite(Number(balance)) ? Number(balance) : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current balance</CardTitle>
        <CardDescription>Spendable internal wallet balance.</CardDescription>
      </CardHeader>
      <CardContent className="text-4xl font-bold">
        {(safeBalance / 100).toFixed(2)} {currency || "USD"}
      </CardContent>
    </Card>
  );
}

export function QRCodeCard({ address }: { address: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit address</CardTitle>
        <CardDescription>
          Send only the supported asset/network shown here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid aspect-square max-w-48 place-items-center rounded-lg bg-muted font-mono text-xs">
          QR
          <br />
          {address.slice(0, 10)}...
        </div>
        <code className="block break-all rounded bg-muted p-3 text-sm">
          {address}
        </code>
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(address)}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy address
        </Button>
      </CardContent>
    </Card>
  );
}

export function DepositStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "CONFIRMED" ? "default" : "secondary"}>
      {status}
    </Badge>
  );
}
