'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import { Loader2, Eye, EyeOff, LogIn } from 'lucide-react';

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      console.log('Login successful:', result);
      console.log('Redirecting to dashboard');
      // Use window.location for full page reload to ensure session is loaded
      window.location.href = '/client/dashboard';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Spotlight from top left */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_0%_0%,_rgba(14,165,233,0.6)_0%,_transparent_60%)]" />

      {/* Logo top left */}
      <div className="absolute top-6 left-6 z-20">
        <img src="/logo.png" alt="Eyes AI" className="h-16" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-gradient-to-br from-white/40 via-sky-200/35 to-sky-300/25 backdrop-blur-xl rounded-3xl shadow-2xl shadow-sky-500/20 p-8 border border-sky-200/30">
          {/* Logo Icon */}
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Eyes AI" className="h-16" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-medium text-white mb-2">Welcome to Your Client Portal</h1>
            <p className="text-white/80 text-sm">Access your AI-powered insights and reports.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3.5 bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-md border-t border-white/80 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all shadow-lg shadow-sky-500/20"
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3.5 bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-md border-t border-white/80 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all pr-12 shadow-lg shadow-sky-500/20"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-white/70 hover:text-white">Forgot password?</a>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] hover:from-[#0EA5E9] hover:via-[#0284C7] hover:to-[#0369A1] text-white text-base font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sky-500/40 border-t border-white/30"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Access Portal
                </>
              )}
            </button>
          </form>

          {/* Contact link */}
          <p className="text-center text-white/70 mt-6 text-sm">
            Need help?{' '}
            <a href="#" className="text-sky-400 hover:text-sky-300 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
