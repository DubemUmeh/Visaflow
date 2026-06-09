"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Globe2, Loader2, PlaneTakeoff, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublicPageShell } from "@/components/layout/public-page-shell";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import type { VisaTypeSummary } from "@visaflow/shared-types";

const highlights = [
  { icon: ShieldCheck, title: "Eligibility-first", body: "Start with nationality and destination before opening an account or application draft." },
  { icon: Timer, title: "Processing choices", body: "Compare standard, expedited, and rush options with clear fee expectations." },
  { icon: Sparkles, title: "Document clarity", body: "See the typical documents that reduce delays and missing-information requests." },
];

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function ExplorerPage() {
  const search = useSearchParams();
  const from = search.get("from") ?? "";
  const to = search.get("to") ?? "";
  const [visas, setVisas] = useState<VisaTypeSummary[]>([]);
  const [loading, setLoading] = useState(Boolean(to));

  useEffect(() => {
    if (!to) return;
    setLoading(true);
    api
      .get(`/visa-types?destinationCountryCode=${to}${from ? `&nationalityCountryCode=${from}` : ""}&limit=12`)
      .then(({ data }) => setVisas(getResponseItems<VisaTypeSummary>(data.data)))
      .catch(() => setVisas([]))
      .finally(() => setLoading(false));
  }, [from, to]);

  return (
    <PublicPageShell
      eyebrow="Visa explorer"
      title={from && to ? `Explore visa options from ${from} to ${to}` : "Explore visas by country, purpose, and processing speed."}
      description="Use this public explorer to understand likely visa paths before creating an account. Results are guidance only; official decisions remain with immigration authorities."
    >
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {highlights.map((item, i) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full">
              <CardContent className="p-6">
                <item.icon className="h-6 w-6 text-coral" />
                <h2 className="mt-4 font-semibold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-border/70 bg-sand/45 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">Available visas</h2>
                <p className="mt-1 text-sm text-muted-foreground">{to ? `Destination country code: ${to}` : "Choose countries on the homepage eligibility checker to personalize this list."}</p>
              </div>
              <Button asChild variant="brand">
                <Link href="/#eligibility">Change route <PlaneTakeoff className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-coral" /></div>
          ) : visas.length ? (
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {visas.map((visa) => (
                <div key={visa.id} className="rounded-2xl border border-border/70 p-5 transition hover:-translate-y-1 hover:shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{visa.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{visa.entryType.replace("_", " ")} · {visa.stayDuration ? `${visa.stayDuration} days stay` : "Stay varies"}</p>
                    </div>
                    <Badge variant={visa.isEVisa ? "success" : "secondary"}>{visa.isEVisa ? "eVisa" : "Visa"}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">Processing</p><p className="font-semibold">{visa.processingDaysMin}-{visa.processingDaysMax} days</p></div>
                    <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">From</p><p className="font-semibold">{money(visa.priceStandard)}</p></div>
                  </div>
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href={`/dashboard/applications/new?visaTypeId=${visa.id}&from=${from}&to=${to}`}>Start with this visa <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Globe2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <h3 className="font-semibold text-foreground">No published visa data found for this route yet.</h3>
              <p className="mt-2 text-sm text-muted-foreground">You can still start an application or contact support for route-specific assistance.</p>
              <Button asChild variant="brand" className="mt-5"><Link href="/dashboard/applications/new">Start application</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PublicPageShell>
  );
}
