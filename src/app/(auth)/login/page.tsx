'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('manager@eyesai.com');
  const [password, setPassword] = useState('password');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo login - just redirect to dashboard
    router.push('/dashboard');
  };

  const quickLogin = (role: string) => {
    // Quick demo login
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
            E
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Eyes AI CRM</h1>
          <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="manager@eyesai.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">
            Sign In
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600 text-center mb-4">Quick Login (Demo)</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => quickLogin('manager')}
              className="w-full"
            >
              Manager
            </Button>
            <Button
              variant="outline"
              onClick={() => quickLogin('va')}
              className="w-full"
            >
              VA
            </Button>
            <Button
              variant="outline"
              onClick={() => quickLogin('qa')}
              className="w-full"
            >
              QA
            </Button>
            <Button
              variant="outline"
              onClick={() => quickLogin('viewer')}
              className="w-full"
            >
              Viewer
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}