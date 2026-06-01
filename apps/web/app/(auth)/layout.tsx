import Link from 'next/link';
import { Globe } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">VisaFlow</span>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} VisaFlow. All rights reserved. ·{' '}
        <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
        {' · '}
        <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
      </footer>
    </div>
  );
}
