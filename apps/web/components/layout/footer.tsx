import Link from 'next/link';
import { Globe, /*Twitter, Instagram, Linkedin, Facebook*/ } from 'lucide-react';

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
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">VisaFlow</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              The fastest, most trusted way to apply for visas online. Serving travelers in 180+ countries.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Globe, href: 'https://twitter.com/visaflow', label: 'Twitter' },
                { icon: Globe, href: 'https://instagram.com/visaflow', label: 'Instagram' },
                { icon: Globe, href: 'https://linkedin.com/company/visaflow', label: 'LinkedIn' },
                { icon: Globe, href: 'https://facebook.com/visaflow', label: 'Facebook' },
                // { icon: Twitter, href: 'https://twitter.com/visaflow', label: 'Twitter' },
                // { icon: Instagram, href: 'https://instagram.com/visaflow', label: 'Instagram' },
                // { icon: Linkedin, href: 'https://linkedin.com/company/visaflow', label: 'LinkedIn' },
                // { icon: Facebook, href: 'https://facebook.com/visaflow', label: 'Facebook' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white text-sm font-semibold mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} VisaFlow, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">
              🔒 256-bit SSL Encryption
            </span>
            <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">
              ✓ GDPR Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
