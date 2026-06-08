import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const tiers = [
  {
    name: "Standard",
    price: "From $79",
    speed: "5–10 business days",
    features: [
      "Lowest service cost",
      "Secure document review",
      "Dashboard tracking",
    ],
  },
  {
    name: "Expedited",
    price: "From $119",
    speed: "2–3 business days",
    features: [
      "Priority review queue",
      "Faster support routing",
      "Status notifications",
    ],
  },
  {
    name: "Rush",
    price: "From $199",
    speed: "24–48 hours",
    features: [
      "Urgent handling",
      "Best for close travel dates",
      "Dedicated review checks",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Pricing
          </p>
          <h2 className="mt-3 text-4xl font-bold text-foreground">
            Transparent processing options
          </h2>
          <p className="mt-4 text-muted-foreground">
            Final totals depend on destination, visa type, government fees, and
            selected processing tier.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className="border-blue-100 transition hover:-translate-y-1 hover:shadow-card"
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground">
                  {tier.name}
                </h3>
                <p className="mt-2 text-3xl font-bold text-brand">
                  {tier.price}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Estimated {tier.speed}
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success" />{" "}
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
