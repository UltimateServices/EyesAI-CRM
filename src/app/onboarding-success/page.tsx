'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight, Mail, Calendar, User } from 'lucide-react';

function OnboardingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const companyId = searchParams.get('company_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId && !companyId) {
        setLoading(false);
        return;
      }

      try {
        // Verify the checkout session with our API
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, companyId }),
        });

        if (response.ok) {
          const data = await response.json();
          setCompanyData(data.company);
        }
      } catch (err) {
        console.error('Error verifying session:', err);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [sessionId, companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <Card className="max-w-xl w-full p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-3">
          Welcome to EyesAI!
        </h1>

        <p className="text-lg text-slate-600 mb-8">
          Your subscription is now active. We&apos;re excited to help you grow your business with AI-powered visibility.
        </p>

        {/* Company Info (if available) */}
        {companyData && (
          <Card className="p-4 bg-slate-50 mb-8 text-left">
            <h3 className="font-semibold text-slate-900 mb-3">Your Account Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Company:</span>
                <span className="font-medium text-slate-900">{companyData.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600">Plan:</span>
                <span className="font-medium text-slate-900">{companyData.plan}</span>
              </div>
            </div>
          </Card>
        )}

        {/* What's Next */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            What Happens Next?
          </h3>
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>You&apos;ll receive a welcome email with your login credentials</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>Our team will begin setting up your AI-optimized business profile</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>You can access your client portal to upload media and track progress</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
              <span>Your profile will go live on EyesAI within 48-72 hours</span>
            </li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="gap-2"
          >
            <a href="/client/login">
              Access Client Portal
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <a href="https://eyesai.webflow.io">
              Return to EyesAI
            </a>
          </Button>
        </div>

        {/* Support Note */}
        <p className="text-xs text-slate-500 mt-8">
          Questions? Contact us at support@eyesai.ai
        </p>
      </Card>
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    }>
      <OnboardingSuccessContent />
    </Suspense>
  );
}
