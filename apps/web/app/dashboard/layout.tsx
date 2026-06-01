'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, Globe, User, Settings,
  LogOut, Bell, ChevronRight, Menu, X, LifeBuoy
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/applications', label: 'Applications', icon: FileText },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { href: '/dashboard/explore', label: 'Explore Visas', icon: Globe },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'VF';

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-50 flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">VisaFlow</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, refreshUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    refreshUser();
  }, [isAuthenticated, router, refreshUser]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link href="/dashboard/notifications" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </Link>
            </Button>
            <Link href="/dashboard/applications/new">
              <Button variant="brand" size="sm" className="hidden sm:flex">
                + New Application
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
