'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Loader2, Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface WelcomeEmailModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface EmailData {
  ownerName: string;
  businessName: string;
  businessSlug: string;
  clientEmail: string;
  profileUrl: string;
  videoUrl: string;
  videoThumbnailUrl: string;
  packageType: string;
  packagePrice: string;
  loginUrl: string;
  tempPassword: string;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
  required: boolean;
}

export function WelcomeEmailModal({
  companyId,
  companyName,
  onClose,
  onSuccess
}: WelcomeEmailModalProps) {
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [completingOnboarding, setCompletingOnboarding] = useState(false);
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [allChecksPass, setAllChecksPass] = useState(false);

  // Fetch all data needed for email
  useEffect(() => {
    const fetchEmailData = async () => {
      try {
        setLoading(true);

        // Fetch company details
        const companyRes = await fetch(`/api/companies/${companyId}`);
        const { data: company } = await companyRes.json();

        console.log('Step 9 - Company data:', {
          webflow_slug: company.webflow_slug,
          profile_slug: company.profile_slug,
          webflow_published: company.webflow_published,
        });

        // Fetch intake for owner name
        const intakeRes = await fetch(`/api/intakes?companyId=${companyId}`);
        const { data: intakes } = await intakeRes.json();
        const intake = intakes?.[0];

        // Build email data
        const slug = company.webflow_slug || company.profile_slug || '';
        console.log('Step 9 - Using slug:', slug);
        const data: EmailData = {
          ownerName: intake?.ownerPrincipal || company.contact_name || 'Owner',
          businessName: company.name,
          businessSlug: slug,
          clientEmail: company.email || '',
          profileUrl: slug
            ? `https://eyesai.webflow.io/profile/${slug}`
            : (company.webflow_published ? `https://eyesai.webflow.io/profile/${company.name.toLowerCase().replace(/\s+/g, '-')}` : ''),
          videoUrl: company.welcome_video_url || '',
          videoThumbnailUrl: company.welcome_video_thumbnail_url || '',
          packageType: company.plan || 'DISCOVER',
          packagePrice: company.plan === 'DISCOVER' ? '$39' : '$69',
          loginUrl: `${window.location.origin}/client/login`,
          tempPassword: generateTempPassword(),
        };

        setEmailData(data);

        // Build checklist
        const checks: ChecklistItem[] = [
          { label: 'Owner name available', checked: !!data.ownerName && data.ownerName !== 'Owner', required: false },
          { label: 'Business name confirmed', checked: !!data.businessName, required: true },
          { label: 'Client email address valid', checked: !!data.clientEmail && data.clientEmail.includes('@'), required: true },
          { label: 'Profile published to Webflow', checked: !!data.profileUrl || !!company.webflow_published, required: true },
          { label: 'Welcome video uploaded', checked: !!data.videoUrl, required: true },
          { label: 'Package type selected', checked: !!data.packageType, required: false },
        ];

        setChecklist(checks);

        // Check if all required items pass
        const allPass = checks.filter(c => c.required).every(c => c.checked);
        setAllChecksPass(allPass);

      } catch (error) {
        console.error('Error fetching email data:', error);
        alert('❌ Failed to load email data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmailData();
  }, [companyId]);

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSendEmail = async () => {
    if (!emailData) return;

    setSendingEmail(true);
    try {
      const response = await fetch('/api/onboarding/send-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          emailData,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to send email');
      }

      alert('✅ Welcome email sent successfully!');
    } catch (error: any) {
      console.error('Send email error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!emailData) return;

    const confirmed = confirm(
      'This will mark Step 9 complete and move the company to DISCOVER status. Are you sure?'
    );

    if (!confirmed) return;

    setCompletingOnboarding(true);
    try {
      const response = await fetch('/api/onboarding/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to complete onboarding');
      }

      alert('✅ Onboarding complete! Company moved to DISCOVER status.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Complete onboarding error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCompletingOnboarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Step 9: Welcome Email Preview</h2>
                <p className="text-sm text-slate-600">{companyName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={sendingEmail || completingOnboarding}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-slate-600">Loading email preview...</span>
            </div>
          ) : (
            <>
              {/* Email Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Email Preview</h3>
                <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 max-h-96 overflow-y-auto">
                  {/* Simplified email preview */}
                  <div className="bg-white p-8 rounded-lg shadow-sm">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold text-indigo-600 mb-2">eyes AI</h1>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                        ✨ Welcome to EyesAI
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 mb-2">You're officially AI-discoverable</h2>
                    <p className="text-sm text-slate-600 mb-6">
                      Customers can now find you on ChatGPT, Google, Claude & beyond
                    </p>

                    <p className="text-slate-700 mb-4">Hi {emailData?.ownerName},</p>
                    <p className="text-slate-700 mb-6">
                      Congratulations! <strong>{emailData?.businessName}</strong> is now live on EyesAI.
                      Your business profile is optimized and ready to be discovered by customers searching on AI platforms.
                    </p>

                    {/* Profile Card */}
                    <div className="bg-slate-800 text-white p-4 rounded-lg mb-6">
                      <p className="text-sm mb-2">{emailData?.businessName}</p>
                      <p className="text-xs text-slate-400 mb-3">@{emailData?.businessSlug}</p>
                      <button className="w-full bg-white text-slate-900 py-2 rounded-lg text-sm font-medium">
                        View Your Live Profile →
                      </button>
                    </div>

                    {/* Package Info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                      <p className="text-xs text-slate-600 mb-1">YOUR PLAN</p>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{emailData?.packageType} Package</p>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm">
                          {emailData?.packagePrice}/mo
                        </span>
                      </div>
                    </div>

                    {/* Video Section */}
                    {emailData?.videoUrl && (
                      <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 mb-6">
                        <p className="text-sm font-semibold text-amber-900 mb-2">🎁 BONUS INCLUDED</p>
                        <p className="text-sm text-amber-800 mb-3">Your Personalized Welcome Video</p>
                        <div className="bg-slate-800 h-32 rounded-lg flex items-center justify-center mb-3">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-8 border-l-slate-800 border-y-6 border-y-transparent ml-1"></div>
                          </div>
                        </div>
                        <button className="text-sm text-indigo-600 font-medium">Watch & Download Video</button>
                      </div>
                    )}

                    {/* Login Credentials */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-sm font-semibold text-slate-900 mb-3">📊 Your Client Dashboard</p>
                      <div className="bg-white border border-slate-200 rounded-lg p-3 mb-3">
                        <p className="text-xs text-slate-600 mb-1">USERNAME (EMAIL)</p>
                        <p className="text-sm font-mono text-slate-900 mb-3">{emailData?.clientEmail}</p>
                        <p className="text-xs text-slate-600 mb-1">TEMPORARY PASSWORD</p>
                        <p className="text-sm font-mono bg-yellow-100 px-2 py-1 rounded text-slate-900">
                          {emailData?.tempPassword}
                        </p>
                      </div>
                      <p className="text-xs text-amber-700 mb-3">⚠️ Please change your password after your first login</p>
                      <button className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium">
                        Login to Dashboard
                      </button>
                    </div>

                    {/* What's Next */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-slate-900 mb-3">📅 What happens next?</p>
                      <ul className="text-sm text-slate-700 space-y-2">
                        <li>• <strong>This week:</strong> Profile appears in AI search results</li>
                        <li>• <strong>Monthly:</strong> SEO performance reports via email</li>
                        <li>• <strong>Ongoing:</strong> Continuous optimization</li>
                      </ul>
                    </div>

                    <p className="text-sm text-slate-600 text-center">
                      Questions? Reply to this email or reach out at support@eyesai.ai
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Pre-Send Verification</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="space-y-3">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {item.checked ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className={`w-5 h-5 flex-shrink-0 ${item.required ? 'text-red-500' : 'text-amber-500'}`} />
                        )}
                        <span className={`text-sm ${item.checked ? 'text-slate-700' : item.required ? 'text-red-700 font-medium' : 'text-amber-700'}`}>
                          {item.label}
                          {item.required && !item.checked && ' (Required)'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {!allChecksPass && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        ⚠️ Please complete all required items before sending the welcome email.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={sendingEmail || completingOnboarding}
                >
                  Cancel
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSendEmail}
                    disabled={!allChecksPass || sendingEmail || completingOnboarding}
                    className="gap-2"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Welcome Email
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCompleteOnboarding}
                    disabled={completingOnboarding || sendingEmail}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {completingOnboarding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Onboarding
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
