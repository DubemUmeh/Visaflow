// components/currency-display.tsx
import { formatCurrency } from "@/lib/utils";

export function CurrencyDisplay({
  amountInCents,
  currency = "USD",
  className,
}: {
  amountInCents: number;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={className}>{formatCurrency(amountInCents, currency)}</span>
  );
}
