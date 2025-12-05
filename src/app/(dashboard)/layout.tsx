'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  Briefcase,
  User as UserIcon,
  Search,
  Bell,
  ChevronDown,
  MessageSquare,
  UserPlus,
  Users,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatNotificationProvider, useChatNotifications } from '@/contexts/ChatNotificationContext';

const supabase = createClientComponentClient();

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUserRole = useStore((state) => state.currentUserRole);
  const currentOrganization = useStore((state) => state.currentOrganization);

  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error) {
          console.error('Auth check error:', error);
          // Don't redirect on error - session might still be valid
          return;
        }

        if (!user) {
          // Only redirect if truly no user
          router.push('/login');
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error('Auth error:', error);
        // Don't redirect on exception
      }
    };

    getUser();

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Simple polling for waiting chats (every 10 seconds)
  useEffect(() => {
    if (!user) return;

    const checkWaitingChats = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('status', 'waiting_human');

        if (!error && data) {
          const newCount = data.length;
          if (newCount > waitingCount && newCount > 0) {
            // New waiting chat - play sound
            playNotificationSound();
          }
          setWaitingCount(newCount);
        }
      } catch (error) {
        console.error('Error checking waiting chats:', error);
      }
    };

    // Check immediately
    checkWaitingChats();

    // Then poll every 10 seconds
    const interval = setInterval(checkWaitingChats, 10000);

    return () => clearInterval(interval);
  }, [user, waitingCount]);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      [0, 0.3].forEach((delay) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.3);
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + 0.3);
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getRoleIcon = () => {
    switch (currentUserRole) {
      case 'admin': return <Crown className="w-3 h-3" />;
      case 'manager': return <Briefcase className="w-3 h-3" />;
      case 'va': return <UserIcon className="w-3 h-3" />;
      default: return <UserIcon className="w-3 h-3" />;
    }
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/new-clients', icon: UserPlus, label: 'New Clients' },
    { href: '/discover-clients', icon: Users, label: 'Discover Clients' },
    { href: '/verified-clients', icon: BadgeCheck, label: 'Verified Clients' },
    { href: '/companies', icon: Building2, label: 'Companies' },
    { href: '/support', icon: MessageSquare, label: 'Support' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60
        transform transition-transition duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <img
                src="/logo.png"
                alt="Eyes AI"
                className="h-8"
              />
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Workspace Selector */}
          <div className="p-4">
            <button className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-100/80 hover:bg-slate-100 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {currentOrganization?.name?.charAt(0) || 'W'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900 truncate max-w-[120px]">
                    {currentOrganization?.name || 'My Workspace'}
                  </p>
                  <p className="text-xs text-slate-500">Pro plan</p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
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
          <div className="p-4 border-t border-slate-200/60">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 mt-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-12 py-2 bg-slate-100/80 border-0 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-400">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">⌘</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 font-mono">K</kbd>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <Link
                href="/support"
                className={`p-2 hover:bg-slate-100 rounded-xl transition-all relative ${waitingCount > 0 ? 'animate-pulse' : ''}`}
              >
                <Bell className={`w-5 h-5 ${waitingCount > 0 ? 'text-yellow-600' : 'text-slate-600'}`} />
                {waitingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {waitingCount}
                  </span>
                )}
              </Link>

              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-slate-900">{user.email?.split('@')[0]}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    {getRoleIcon()}
                    {currentUserRole?.toUpperCase() || 'USER'}
                  </p>
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardContent>{children}</DashboardContent>;
}
