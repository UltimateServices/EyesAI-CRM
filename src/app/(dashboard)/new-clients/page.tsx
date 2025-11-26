'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Plus,
  Loader2,
  Building2,
  ExternalLink,
  Bot,
  Star,
  Upload,
  Globe,
  Camera,
  FileText,
  Video,
  Mail,
  Circle,
  CheckCircle2
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  action: string;
  completed: boolean;
}

interface CompanySteps {
  [companyId: string]: OnboardingStep[];
}

export default function NewClientsPage() {
  const companies = useStore((state) => state.companies);
  const fetchCompanies = useStore((state) => state.fetchCompanies);
  const currentOrganization = useStore((state) => state.currentOrganization);
  const initializeOrganization = useStore((state) => state.initializeOrganization);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companySteps, setCompanySteps] = useState<CompanySteps>({});
  const [processingSteps, setProcessingSteps] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    name: '',
    website: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Ensure organization is initialized first
        if (!currentOrganization) {
          console.log('Initializing organization...');
          await initializeOrganization();
        }
        console.log('Fetching companies...');
        await fetchCompanies();
        console.log('Companies fetched');
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
      setLoading(false);
    };
    loadData();
  }, [fetchCompanies, initializeOrganization, currentOrganization]);

  const newCompanies = companies.filter((company) => company.status === 'NEW');

  console.log('All companies:', companies.length);
  console.log('New companies:', newCompanies.length);
  console.log('Companies with NEW status:', companies.filter(c => c.status === 'NEW').map(c => ({ name: c.name, status: c.status })));

  // Fetch onboarding steps for each new company
  useEffect(() => {
    const fetchStepsForCompanies = async () => {
      for (const company of newCompanies) {
        // Always fetch steps to get latest data
        try {
          const response = await fetch(`/api/onboarding/steps/${company.id}`);
          const data = await response.json();

          if (data.success && data.steps) {
            const mappedSteps = mapStepsToUI(data.steps);
            setCompanySteps(prev => ({
              ...prev,
              [company.id]: mappedSteps
            }));
          }
        } catch (error) {
          console.error(`Error fetching steps for ${company.id}:`, error);
        }
      }
    };

    if (newCompanies.length > 0 && !loading) {
      fetchStepsForCompanies();
    }
  }, [newCompanies.length, loading]);

  const mapStepsToUI = (dbSteps: any[]): OnboardingStep[] => {
    const stepConfig = [
      { id: 1, title: 'Stripe Signup', description: 'Company created from Stripe payment', icon: CheckCircle2, action: 'completed' },
      { id: 2, title: 'AI Intake', description: 'Run Claude agent to perform intake', icon: Bot, action: 'Run Intake' },
      { id: 3, title: 'Pull Reviews', description: 'Gemini agent pulls in reviews', icon: Star, action: 'Get Reviews' },
      { id: 4, title: 'Upload Images', description: 'VA downloads and uploads images', icon: Upload, action: 'Upload Images' },
      { id: 5, title: 'Publish Profile', description: 'Make profile live on website', icon: Globe, action: 'Publish' },
      { id: 6, title: 'Screenshot Profile', description: 'Take screenshots of live profile', icon: Camera, action: 'Take Screenshots' },
      { id: 7, title: 'Video Script', description: 'Generate welcome video script', icon: FileText, action: 'Get Script' },
      { id: 8, title: 'Create Video', description: 'Make and download HeyGen video', icon: Video, action: 'Open HeyGen' },
      { id: 9, title: 'Welcome Email', description: 'Send welcome email → Move to Discover/Verified', icon: Mail, action: 'Send Email' },
    ];

    return stepConfig.map(config => {
      const dbStep = dbSteps.find(s => s.step_number === config.id);
      return {
        ...config,
        completed: dbStep?.completed || false
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let website = formData.website.trim();
      if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
        website = 'https://' + website;
      }
      website = website.replace(/^(https?:\/\/)www\./, '$1');

      const response = await fetch('/api/test/create-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          website,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create company');
      }

      console.log('Company created:', data.company);
      alert(`✅ ${data.message}`);
      setFormData({
        name: '',
        website: '',
      });
      setShowForm(false);

      // Force refresh companies
      console.log('Refreshing companies after create...');
      await fetchCompanies();
      console.log('Companies refreshed, total:', companies.length);
    } catch (error: any) {
      alert(`❌ Failed: ${error.message}`);
      console.error('Create error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepAction = async (companyId: string, stepNumber: number, action: string) => {
    const stepKey = `${companyId}-${stepNumber}`;

    // Prevent multiple simultaneous clicks
    if (processingSteps[stepKey]) return;

    setProcessingSteps(prev => ({ ...prev, [stepKey]: true }));

    try {
      // Handle different step actions
      switch (stepNumber) {
        case 2: // AI Intake
          await handleAIIntake(companyId);
          break;
        case 3: // Pull Reviews
          await handlePullReviews(companyId);
          break;
        case 4: // Upload Images
          await handleUploadImages(companyId);
          break;
        case 5: // Publish Profile
          await handlePublishProfile(companyId);
          break;
        case 6: // Screenshot Profile
          await handleScreenshotProfile(companyId);
          break;
        case 7: // Video Script
          await handleVideoScript(companyId);
          break;
        case 8: // Create Video (HeyGen)
          await handleCreateVideo(companyId);
          break;
        case 9: // Welcome Email
          await handleWelcomeEmail(companyId);
          break;
        default:
          console.log(`No handler for step ${stepNumber}`);
      }

      // Refresh steps after action
      await refreshCompanySteps(companyId);
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
      console.error('Step action error:', error);
    } finally {
      setProcessingSteps(prev => ({ ...prev, [stepKey]: false }));
    }
  };

  const refreshCompanySteps = async (companyId: string) => {
    try {
      const response = await fetch(`/api/onboarding/steps/${companyId}`);
      const data = await response.json();

      if (data.success && data.steps) {
        const mappedSteps = mapStepsToUI(data.steps);
        setCompanySteps(prev => ({
          ...prev,
          [companyId]: mappedSteps
        }));
      }
    } catch (error) {
      console.error(`Error refreshing steps for ${companyId}:`, error);
    }
  };

  // Step action handlers
  const handleAIIntake = async (companyId: string) => {
    const response = await fetch('/api/onboarding/ai-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to run AI intake');
    }

    alert('✅ AI Intake completed successfully!');
  };

  const handlePullReviews = async (companyId: string) => {
    // TODO: Implement Gemini review pulling - for now, manual completion
    const confirmed = confirm('Have you pulled and added reviews for this company? Click OK to mark as complete.');

    if (!confirmed) return;

    const response = await fetch(`/api/onboarding/steps/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_number: 3, completed: true }),
    });

    if (response.ok) {
      alert('✅ Reviews step marked as complete!');
    } else {
      throw new Error('Failed to update step');
    }
  };

  const handleUploadImages = async (companyId: string) => {
    // Manual completion for VA
    const confirmed = confirm('Have you downloaded and uploaded all images for this company? Click OK to mark as complete.');

    if (!confirmed) return;

    const response = await fetch(`/api/onboarding/steps/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_number: 4, completed: true }),
    });

    if (response.ok) {
      alert('✅ Image upload step marked as complete!');
    } else {
      throw new Error('Failed to update step');
    }
  };

  const handlePublishProfile = async (companyId: string) => {
    // Use existing publish endpoint
    const response = await fetch('/api/webflow/publish-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to publish profile');
    }

    // Mark step as complete
    await fetch(`/api/onboarding/steps/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_number: 5, completed: true }),
    });

    alert('✅ Profile published to Webflow successfully!');
  };

  const handleScreenshotProfile = async (companyId: string) => {
    // Manual completion for taking screenshots
    const confirmed = confirm('Have you taken screenshots of the live profile? Click OK to mark as complete.');

    if (!confirmed) return;

    const response = await fetch(`/api/onboarding/steps/${companyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_number: 6, completed: true }),
    });

    if (response.ok) {
      alert('✅ Screenshot step marked as complete!');
    } else {
      throw new Error('Failed to update step');
    }
  };

  const handleVideoScript = async (companyId: string) => {
    const response = await fetch('/api/onboarding/video-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate video script');
    }

    // Show script in alert (we can make this a modal later)
    alert(`✅ Video script generated!\n\n${data.script}`);
  };

  const handleCreateVideo = async (companyId: string) => {
    // Open HeyGen in a new tab
    const heygenUrl = 'https://app.heygen.com';
    window.open(heygenUrl, '_blank');

    // Mark step as complete after user confirms they created the video
    const confirmed = confirm('After you create and download the video in HeyGen, click OK to mark this step as complete.');

    if (confirmed) {
      const response = await fetch(`/api/onboarding/steps/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: 8, completed: true }),
      });

      if (response.ok) {
        alert('✅ Video creation step marked as complete!');
      }
    }
  };

  const handleWelcomeEmail = async (companyId: string) => {
    const confirmed = confirm('This will send the welcome email and move the company to DISCOVER status. Continue?');

    if (!confirmed) return;

    const response = await fetch('/api/onboarding/welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send welcome email');
    }

    alert('✅ Welcome email sent! Company moved to DISCOVER status.');

    // Refresh companies to reflect status change
    await fetchCompanies();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Clients</h1>
          <p className="text-slate-600 mt-1">
            {newCompanies.length} {newCompanies.length === 1 ? 'client' : 'clients'} in onboarding
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add Company'}
        </Button>
      </div>

      {/* Test Form */}
      {showForm && (
        <Card className="p-6 bg-white border-2 border-blue-200">
          <h3 className="font-semibold text-lg mb-4">Add New Company</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Website *
                </label>
                <Input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  required
                  placeholder="example.com"
                />
                <p className="text-xs text-slate-500 mt-1">No need for http:// or www</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Company
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Company List with Onboarding Steps */}
      <div className="space-y-6">
        {loading ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading new clients...</p>
          </Card>
        ) : newCompanies.length > 0 ? (
          newCompanies.map((company) => {
            const steps = companySteps[company.id] || [];
            const completedSteps = steps.filter(s => s.completed).length;

            return (
              <Card key={company.id} className="p-6">
                {/* Company Header */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {company.name}
                        </h3>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 mt-1 inline-flex items-center gap-1 hover:underline"
                        >
                          {company.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          NEW
                        </Badge>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                          {completedSteps}/{steps.length} Complete
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <span>Onboarding Progress</span>
                        <span className="font-semibold">{Math.round((completedSteps / steps.length) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(completedSteps / steps.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Onboarding Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <Card
                        key={step.id}
                        className={`p-4 ${
                          step.completed
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            step.completed
                              ? 'bg-green-100'
                              : 'bg-slate-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              step.completed
                                ? 'text-green-600'
                                : 'text-slate-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-slate-500">
                                STEP {step.id}
                              </span>
                              {step.completed && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <h4 className="font-semibold text-sm text-slate-900 mb-1">
                              {step.title}
                            </h4>
                            <p className="text-xs text-slate-600 mb-3">
                              {step.description}
                            </p>
                            {!step.completed && step.action !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => handleStepAction(company.id, step.id, step.action)}
                                disabled={processingSteps[`${company.id}-${step.id}`]}
                              >
                                {processingSteps[`${company.id}-${step.id}`] ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  step.action
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-12 text-center bg-slate-50">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No new clients</h3>
            <p className="text-slate-600">
              All clients have been onboarded. Click "Add Company" to create a test company.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
