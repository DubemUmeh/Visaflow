import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Section = { title: string; body: string };

export function InfoPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: Section[];
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50/70 via-white to-white px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            {eyebrow}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <Card
              key={section.title}
              className="border-blue-100 bg-white/85 shadow-card backdrop-blur"
            >
              <CardContent className="p-6">
                <CheckCircle2 className="mb-4 h-5 w-5 text-brand" />
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {section.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10 rounded-3xl bg-slate-950 p-8 text-white shadow-elegant">
          <h2 className="text-2xl font-bold">
            Need help choosing a visa path?
          </h2>
          <p className="mt-2 max-w-2xl text-white/70">
            Use VisaFlow’s eligibility tools or contact support for guidance
            before you submit documents or pay government fees.
          </p>
          <Button asChild variant="brand" className="mt-6">
            <Link href="/help">
              Visit help center <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
