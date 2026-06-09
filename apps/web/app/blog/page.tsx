import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicPageShell } from "@/components/layout/public-page-shell";

const posts = [
  { href: "/blog/clean-passport-scan", title: "How to prepare a clean passport scan", body: "A practical checklist for lighting, file size, page edges, and common upload mistakes.", meta: "Documents" },
  { href: "/blog/processing-tiers", title: "Standard, expedited, or rush processing", body: "How to choose a speed tier without paying for urgency you do not need.", meta: "Payments" },
  { href: "/blog/after-you-submit", title: "What happens after you submit", body: "A plain-English walkthrough of review, missing document requests, approval, and delivery.", meta: "Applications" },
];

export default function BlogPage() {
  return (
    <PublicPageShell
      eyebrow="Resources"
      title="Guides for smoother travel documents."
      description="Short, practical articles for preparing stronger applications and understanding the VisaFlow workflow."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.href} href={post.href} className="group rounded-2xl border border-border/80 bg-card/80 p-5 shadow-card backdrop-blur transition-all hover:-translate-y-1 hover:border-coral/40 hover:shadow-elegant">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-coral">{post.meta}</p>
            <h2 className="mt-2 font-display text-lg font-semibold text-foreground group-hover:text-coral">{post.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{post.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-coral">Read guide <ArrowRight className="h-4 w-4" /></span>
          </Link>
        ))}
      </div>
      <Link href="/dashboard/applications/new" className="mt-8 inline-flex items-center gap-2 rounded-full bg-hero px-5 py-3 text-sm font-semibold text-white shadow-card">
        Start an application <ArrowRight className="h-4 w-4" />
      </Link>
    </PublicPageShell>
  );
}
