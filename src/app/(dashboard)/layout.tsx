'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Building2, 
  CheckSquare, 
  FileText, 
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { getCurrentUser, signOut } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await getCurrentUser();
    if (user) {
      setUserEmail(user.email || '');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Eyes AI CRM</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Button>
          </Link>
          
          <Link href="/companies">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Building2 className="w-5 h-5" />
              Companies
            </Button>
          </Link>
          
          <Link href="/tasks">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <CheckSquare className="w-5 h-5" />
              Tasks
            </Button>
          </Link>
          
          <Link href="/content">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <FileText className="w-5 h-5" />
              Content
            </Button>
          </Link>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span className="truncate">{userEmail}</span>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}