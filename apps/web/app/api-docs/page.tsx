import { Code2, KeyRound, ShieldCheck, Workflow } from "lucide-react";
import { ContentCard, PublicPageShell } from "@/components/layout/public-page-shell";

const endpoints = [
  { method: "POST", path: "/api/v1/auth/register", desc: "Create an applicant account and receive access tokens." },
  { method: "GET", path: "/api/v1/countries", desc: "List published destination countries with visa counts." },
  { method: "GET", path: "/api/v1/eligibility", desc: "Check travel eligibility by nationality and destination." },
  { method: "POST", path: "/api/v1/applications", desc: "Start a visa application after authentication." },
  { method: "GET", path: "/api/v1/notifications", desc: "Read account, payment, and application status notifications." },
  { method: "POST", path: "/api/v1/payments/checkout", desc: "Create Stripe, PayPal, WalletConnect, or wallet-address payment intents." },
];

export default function ApiDocsPage() {
  return (
    <PublicPageShell
      eyebrow="Developers"
      title="VisaFlow API documentation"
      description="A professional overview of the REST endpoints used by the VisaFlow web app. Use the versioned API paths for secure integrations, internal tooling, and partner workflows."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          { icon: KeyRound, title: "Authentication", body: "Use bearer JWT access tokens. Refresh tokens should be stored securely and rotated through the auth refresh endpoint." },
          { icon: ShieldCheck, title: "Authorization", body: "Applicant endpoints are scoped to the signed-in user. Admin operations require ADMIN or SUPER_ADMIN roles." },
          { icon: Workflow, title: "Versioning", body: "All production routes are versioned under /api/v1 so future changes can remain backward compatible." },
        ].map((item) => (
          <ContentCard key={item.title}>
            <item.icon className="h-6 w-6 text-coral" />
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
          </ContentCard>
        ))}
      </div>

      <ContentCard>
        <div className="mb-5 flex items-center gap-2">
          <Code2 className="h-5 w-5 text-coral" />
          <h2 className="font-display text-2xl font-semibold text-foreground">Core endpoints</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/70">
          {endpoints.map((endpoint) => (
            <div key={endpoint.path} className="grid gap-2 border-b border-border/70 p-4 last:border-b-0 md:grid-cols-[110px_1fr_1.3fr]">
              <span className="w-fit rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">{endpoint.method}</span>
              <code className="text-sm font-semibold text-foreground">{endpoint.path}</code>
              <p className="text-sm text-muted-foreground">{endpoint.desc}</p>
            </div>
          ))}
        </div>
      </ContentCard>
    </PublicPageShell>
  );
}
