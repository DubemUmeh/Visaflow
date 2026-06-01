'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Menu, X, ChevronDown, Bell, LogOut, User, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const navLinks = [
  { label: 'Countries', href: '/#countries' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setProfileOpen(false);
  };

  const isLandingPage = pathname === '/';

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isLandingPage ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100/80' : 'bg-white border-b border-gray-200'
    )}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">VisaFlow</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link href="/dashboard/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs gradient-brand text-white">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-gray-700">{user.firstName}</span>
                    <ChevronDown className="h-3 w-3 text-gray-500" />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-xl border bg-white shadow-elevated py-1.5 z-50"
                      >
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <LayoutDashboard className="h-4 w-4 text-gray-400" />
                          Dashboard
                        </Link>
                        <Link href="/dashboard/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <User className="h-4 w-4 text-gray-400" />
                          Profile
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="brand">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Dashboard</Button>
                    </Link>
                    <Button variant="ghost" className="w-full text-red-600" onClick={handleLogout}>Sign Out</Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button variant="brand" className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
