import type { ReactNode } from 'react';
import { Navbar } from './navbar';
import { Footer } from './footer';

export function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="relative overflow-hidden border-b border-border/60 bg-sunrise">
          <div className="absolute inset-0 bg-mesh opacity-80" aria-hidden />
          <div className="container-page relative py-16 lg:py-20">
            {eyebrow && (
              <span className="eyebrow-pill">
                {eyebrow}
              </span>
            )}
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </section>
        <section className="container-page py-12 lg:py-16">{children}</section>
      </main>
      <Footer />
    </div>
  );
}

export function ContentCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card/85 p-6 shadow-card backdrop-blur sm:p-8">
      {children}
    </div>
  );
}

export function ProseBlock({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-6 text-base leading-8 text-muted-foreground [&_h2]:pt-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}

export function FeatureGrid({
  items,
}: {
  items: Array<{ title: string; body: string; meta?: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.title} className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-card backdrop-blur transition-all hover:-translate-y-1 hover:border-coral/40 hover:shadow-elegant">
          {item.meta && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-coral">{item.meta}</p>}
          <h2 className="mt-2 font-display text-lg font-semibold text-foreground">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
