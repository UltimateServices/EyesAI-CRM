'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import {
  LayoutDashboard,
  Image,
  FolderOpen,
  HeadphonesIcon,
  CreditCard,
  Sparkles,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeProvider, useTheme } from './ThemeContext';

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supabase] = useState(() => createClientComponentClient());

  useEffect(() => {
    let isMounted = true;

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error) {
          console.error('Auth check error:', error);
          // Don't redirect on error - session might still be valid
          setLoading(false);
          return;
        }

        if (!user && pathname !== '/client/login') {
          router.push('/client/login');
        } else if (user) {
          setUser(user);
        }
      } catch (error) {
        console.error('Auth error:', error);
        // Don't redirect on exception
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getUser();

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/client/login');
  };

  const navItems = [
    { href: '/client/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/client/media', icon: Image, label: 'Media' },
    { href: '/client/content', icon: FolderOpen, label: 'Content Library' },
    { href: '/client/support', icon: HeadphonesIcon, label: 'Support' },
    { href: '/client/billing', icon: CreditCard, label: 'Billing' },
    { href: '/client/upgrade', icon: Sparkles, label: 'Upgrade' },
  ];

  // Don't apply layout to login page
  if (pathname === '/client/login') {
    return <>{children}</>;
  }

  // Show loading screen while checking auth (only on protected pages)
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sky-50/60 to-sky-100/80">
        <div className="text-center">
          <img src="/logo.png" alt="Eyes AI" className="h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen relative ${
      isDark
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-white via-sky-50/60 to-sky-100/80'
    }`}>
      {/* Spotlight Effect - from bottom right in light mode */}
      <div className={`fixed inset-0 pointer-events-none ${
        isDark
          ? 'bg-[radial-gradient(ellipse_120%_120%_at_0%_0%,_rgba(14,165,233,0.15)_0%,_transparent_50%)]'
          : 'bg-[radial-gradient(ellipse_150%_150%_at_100%_100%,_rgba(14,165,233,0.35)_0%,_transparent_50%)]'
      }`} />
      {/* Secondary glow for light mode */}
      {!isDark && (
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,_rgba(56,189,248,0.1)_0%,_transparent_50%)]" />
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72
        ${isDark
          ? 'bg-slate-900/95 backdrop-blur-xl border-r border-white/5'
          : 'bg-transparent border-r border-sky-200/30'
        }
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`px-4 h-[65px] flex items-center border-b ${isDark ? 'border-white/5' : 'border-sky-200/30'}`}>
            <div className="flex items-center justify-between w-full">
              <img
                src="/logo.png"
                alt="Eyes AI"
                className="h-11"
              />
              <button
                onClick={() => setSidebarOpen(false)}
                className={`lg:hidden p-1.5 rounded-lg ${
                  isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Client Portal Badge */}
          <div className="px-5 py-4">
            <div className={`px-4 py-3 rounded-xl border backdrop-blur-sm ${
              isDark
                ? 'bg-gradient-to-r from-sky-500/10 to-blue-500/10 border-sky-400/20'
                : 'bg-gradient-to-r from-sky-400/20 to-blue-400/20 border-sky-300/40 shadow-sm shadow-sky-500/10'
            }`}>
              <p className={`text-sm font-medium ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>Client Portal</p>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-sky-400/60' : 'text-sky-600/70'}`}>Manage your AI presence</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white shadow-lg shadow-sky-500/30 border-t border-white/20'
                      : isDark
                        ? 'text-white/60 hover:bg-white/5 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-sky-200/30'}`}>
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${isDark ? 'bg-white/5' : 'bg-white/50 border border-sky-200/20'}`}>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg shadow-sky-500/30 p-1.5">
                <img
                  src="/major-dumpsters-logo.png"
                  alt="Major Dumpsters"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Major Dumpsters
                </p>
                <p className={`text-xs truncate ${isDark ? 'text-white/40' : 'text-slate-500'}`}>info@majordumpsters.com</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={`w-full justify-start gap-2 ${
                isDark
                  ? 'text-white/50 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72 relative z-10">
        {/* Top Header */}
        <header className={`sticky top-0 z-30 border-b ${
          isDark
            ? 'bg-slate-900/80 backdrop-blur-2xl border-white/5'
            : 'bg-transparent border-sky-200/30'
        }`}>
          <div className="flex items-center justify-between px-6 lg:px-8 h-[65px]">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg ${
                isDark ? 'hover:bg-white/5 text-white/60' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-colors ${
                  isDark
                    ? 'hover:bg-white/5 text-white/60 hover:text-white'
                    : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button className={`p-2.5 rounded-xl transition-colors relative ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'
              }`}>
                <Bell className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full"></span>
              </button>

              <div className={`hidden sm:flex items-center gap-3 pl-3 border-l ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md shadow-sky-500/30 p-1">
                  <img
                    src="/major-dumpsters-logo.png"
                    alt="Major Dumpsters"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="hidden lg:block">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Major Dumpsters</p>
                  <p className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Discover Plan</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-73px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </ThemeProvider>
  );
}
