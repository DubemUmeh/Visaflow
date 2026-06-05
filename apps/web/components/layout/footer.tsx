import Link from 'next/link';
import { Globe, ShieldCheck } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Countries', href: '/#countries' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'API', href: '/api-docs' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
  ],
  Support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Status', href: '/status' },
    { label: 'Track Application', href: '/track' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Refund Policy', href: '/refunds' },
  ],
};

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#09090b] text-neutral-400">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,159,109,0.09),transparent_34%)]"
        aria-hidden
      />
      <div className="container-page relative py-16">
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 gradient-brand">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-2xl font-semibold tracking-tight text-white">VisaFlow</span>
            </Link>
            <p className="mb-6 max-w-xs text-sm leading-relaxed">
              The fastest, most trusted way to apply for visas online. Serving travelers in 180+ countries.
            </p>
            <div className="flex items-center gap-3">
              {[
                { href: 'https://twitter.com/visaflow', label: 'Twitter' },
                { href: 'https://instagram.com/visaflow', label: 'Instagram' },
                { href: 'https://linkedin.com/company/visaflow', label: 'LinkedIn' },
                { href: 'https://facebook.com/visaflow', label: 'Facebook' },
              ].map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-card/5 text-white transition-all hover:border-white/30 hover:bg-card/15"
                >
                  <Globe className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold text-white">{category}</h4>
              <ul className="space-y-2.5 font-mono">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-neutral-500">
            &copy; {new Date().getFullYear()} VisaFlow, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-card/5 px-3 py-1 text-xs text-neutral-300">
              <ShieldCheck className="h-3.5 w-3.5 text-coral" /> 256-bit SSL Encryption
            </span>
            <span className="rounded-full border border-white/10 bg-card/5 px-3 py-1 text-xs text-neutral-300">
              GDPR Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
