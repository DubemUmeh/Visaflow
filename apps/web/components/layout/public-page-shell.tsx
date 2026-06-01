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
    <div className="min-h-screen bg-[#fbfaf7]">
      <Navbar />
      <main className="pt-16">
        <section className="relative overflow-hidden border-b border-gray-200 bg-sunrise">
          <div className="absolute inset-0 bg-mesh opacity-80" aria-hidden />
          <div className="container-page relative py-16 lg:py-20">
            {eyebrow && (
              <span className="inline-flex rounded-full border border-gray-200 bg-white/75 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500 shadow-card backdrop-blur">
                {eyebrow}
              </span>
            )}
            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
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
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card sm:p-8">
      {children}
    </div>
  );
}

export function ProseBlock({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-6 text-base leading-8 text-gray-600 [&_h2]:pt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-gray-950 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
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
        <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-card">
          {item.meta && <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">{item.meta}</p>}
          <h2 className="mt-2 text-lg font-bold text-gray-950">{item.title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
