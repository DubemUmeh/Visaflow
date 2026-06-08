import Link from "next/link";
import { ArrowRight, Globe2, Sparkles, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const visas = [
  {
    title: "Tourist eVisa",
    body: "For holidays, family visits, and short leisure trips with digital document review.",
    icon: Globe2,
  },
  {
    title: "Business visa",
    body: "For meetings, conferences, trade visits, and time-sensitive professional travel.",
    icon: Timer,
  },
  {
    title: "Transit visa",
    body: "For short stopovers when a destination requires authorization before onward travel.",
    icon: Sparkles,
  },
];

export default function ExploreVisasPage() {
  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-500 p-8 text-white shadow-elegant">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
          Explore Visas
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          Find the right visa path before you apply.
        </h1>
        <p className="mt-3 max-w-2xl text-white/80">
          Compare common travel purposes, processing expectations, document
          readiness, and eligibility considerations in one place.
        </p>
        <Button
          asChild
          className="mt-6 bg-white text-blue-700 hover:bg-white/90"
        >
          <Link href="/dashboard/applications/new">
            Start an application <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {visas.map((visa) => (
          <Card
            key={visa.title}
            className="transition hover:-translate-y-1 hover:shadow-card"
          >
            <CardContent className="p-6">
              <visa.icon className="mb-4 h-6 w-6 text-brand" />
              <h2 className="font-semibold text-foreground">{visa.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {visa.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
