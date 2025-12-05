'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StripeInfoModal } from '@/components/onboarding/stripe-info-modal';
import { PasteIntakeModal } from '@/components/onboarding/paste-intake-modal';
import { ReviewsModal } from '@/components/onboarding/reviews-modal';
import { MediaModal } from '@/components/onboarding/media-modal';
import { PublishWebflowModal } from '@/components/onboarding/publish-webflow-modal';
import { VideoUploadModal } from '@/components/onboarding/video-upload-modal';
import { ScreenshotsModal } from '@/components/onboarding/screenshots-modal';
import { VideoScriptModal } from '@/components/onboarding/video-script-modal';
import { WelcomeEmailModal } from '@/components/onboarding/welcome-email-modal';
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
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  X
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
  const [expandedCompanies, setExpandedCompanies] = useState<{ [key: string]: boolean }>({});
  const [stripeInfoModalCompany, setStripeInfoModalCompany] = useState<{ id: string; name: string } | null>(null);
  const [pasteModalCompany, setPasteModalCompany] = useState<{ id: string; name: string } | null>(null);
  const [reviewsModalCompany, setReviewsModalCompany] = useState<{ id: string; name: string } | null>(null);
  const [mediaModalCompany, setMediaModalCompany] = useState<{ id: string; name: string } | null>(null);
  const [publishModalCompany, setPublishModalCompany] = useState<{ id: string; name: string } | null>(null);
  const [screenshotsModalCompany, setScreenshotsModalCompany] = useState<{ id: string; name: string; profileUrl?: string } | null>(null);
  const [videoScriptModalCompany, setVideoScriptModalCompany] = useState<{ id: string; name: string } | null>(null);
  const [videoModalCompany, setVideoModalCompany] = useState<{ id: string; name: string } | null>(null);
  const [welcomeEmailModalCompany, setWelcomeEmailModalCompany] = useState<{ id: string; name: string } | null>(null);
  const [viewJsonModal, setViewJsonModal] = useState<{ companyId: string; companyName: string; json: any } | null>(null);
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
      { id: 1, title: 'Stripe Signup', description: 'Company created from Stripe payment', icon: CheckCircle2, action: 'View Details' },
      { id: 2, title: 'Paste Intake JSON', description: 'Paste Claude Agent JSON and verify all fields/sections are complete', icon: Bot, action: 'Paste Intake' },
      { id: 3, title: 'Reviews', description: 'Verify 5 valid reviews are present', icon: Star, action: 'Manage Reviews' },
      { id: 4, title: 'Logo & Media Library', description: 'Verify 1 logo and 5 gallery images are uploaded', icon: Upload, action: 'Manage Media' },
      { id: 5, title: 'Publish Profile', description: 'Make profile live on website', icon: Globe, action: 'Publish' },
      { id: 6, title: 'Screenshot Profile', description: 'Take screenshots of live profile', icon: Camera, action: 'Take Screenshots' },
      { id: 7, title: 'Video Creation', description: 'Generate script, open HeyGen onboard template, fix images, paste script, start generation', icon: FileText, action: 'Get Script' },
      { id: 8, title: 'Upload Welcome Video', description: 'Download completed video from HeyGen and upload to CRM storage', icon: Video, action: 'Upload Video' },
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
        case 1: // Stripe Checkout
          await handleStripeInfo(companyId);
          break;
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
  const handleStripeInfo = async (companyId: string) => {
    // Find company to get its name
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Open stripe info modal
    setStripeInfoModalCompany({ id: companyId, name: company.name });
  };

  const handleAIIntake = async (companyId: string) => {
    // Find company to get its name
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Open paste modal
    setPasteModalCompany({ id: companyId, name: company.name });
  };

  const handlePullReviews = async (companyId: string) => {
    // Find company to get its name
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Open reviews modal
    setReviewsModalCompany({ id: companyId, name: company.name });
  };

  const handleUploadImages = async (companyId: string) => {
    // Find company to get its name
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Open media modal
    setMediaModalCompany({ id: companyId, name: company.name });
  };

  const handlePublishProfile = async (companyId: string) => {
    // Find company to get its name
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Open publish modal
    setPublishModalCompany({ id: companyId, name: company.name });
  };

  const handleScreenshotProfile = async (companyId: string) => {
    // Find company to get its name and profile URL
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Get profile URL from company's webflow_profile_url or construct it
    const profileUrl = company.webflow_profile_url ||
      `https://eyesai.webflow.io/profile/${company.slug || company.name.toLowerCase().replace(/\s+/g, '-')}`;

    // Open screenshots modal
    setScreenshotsModalCompany({
      id: companyId,
      name: company.name,
      profileUrl
    });
  };

  const handleVideoScript = async (companyId: string) => {
    // Find company to get its name
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Open video script modal
    setVideoScriptModalCompany({ id: companyId, name: company.name });
  };

  const handleCreateVideo = async (companyId: string) => {
    // Find company to get its name
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Open video upload modal
    setVideoModalCompany({ id: companyId, name: company.name });
  };

  const handleWelcomeEmail = async (companyId: string) => {
    // Find company to get its name
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    // Open welcome email modal
    setWelcomeEmailModalCompany({ id: companyId, name: company.name });
  };

  const handleViewJSON = async (companyId: string) => {
    try {
      const company = companies.find(c => c.id === companyId);
      if (!company) {
        alert('❌ Error: Company not found');
        return;
      }

      // Fetch the intake JSON
      const response = await fetch(`/api/intakes?companyId=${companyId}`);

      if (!response.ok) {
        const data = await response.json();
        alert(`❌ Error: ${data.error || 'Failed to fetch intake JSON'}`);
        return;
      }

      const data = await response.json();

      if (!data.intake?.roma_data) {
        alert('No JSON data found for this company.');
        return;
      }

      // Ensure JSON is valid
      const jsonData = typeof data.intake.roma_data === 'string'
        ? JSON.parse(data.intake.roma_data)
        : data.intake.roma_data;

      // Reorder JSON to put hero and about first
      const orderedJson: any = {};
      const keyOrder = ['hero', 'about', 'faqs', 'services', 'reviews', 'gallery', 'contact', 'metadata'];

      // Add keys in desired order
      keyOrder.forEach(key => {
        if (jsonData[key] !== undefined) {
          orderedJson[key] = jsonData[key];
        }
      });

      // Add any remaining keys not in the order list
      Object.keys(jsonData).forEach(key => {
        if (!keyOrder.includes(key)) {
          orderedJson[key] = jsonData[key];
        }
      });

      // Open modal with JSON
      setViewJsonModal({
        companyId,
        companyName: company.name,
        json: orderedJson,
      });
    } catch (error: any) {
      console.error('View JSON error:', error);
      alert(`❌ Error loading JSON: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    const confirmed = confirm(`Are you sure you want to permanently delete "${companyName}" and all related data (steps, intakes, reviews, media)? This cannot be undone.`);

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete company');
      }

      alert(`✅ ${data.message}`);

      // Refresh companies list
      await fetchCompanies();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
      console.error('Delete error:', error);
    }
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id, company.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <span>Onboarding Progress</span>
                          <span className="font-semibold">{Math.round((completedSteps / steps.length) * 100)}%</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCompanies(prev => ({
                            ...prev,
                            [company.id]: !prev[company.id]
                          }))}
                          className="gap-2"
                        >
                          {expandedCompanies[company.id] ? (
                            <>
                              Hide Steps
                              <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              Show Steps
                              <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </Button>
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

                {/* Onboarding Steps - Collapsible */}
                {expandedCompanies[company.id] && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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
                            {(!step.completed || step.id === 1 || step.id === 5 || step.id === 2 || step.id === 6 || step.id === 7 || step.id === 8) && step.action !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs"
                                onClick={() => {
                                  if (step.completed && step.id === 2) {
                                    handleViewJSON(company.id);
                                  } else {
                                    handleStepAction(company.id, step.id, step.action);
                                  }
                                }}
                                disabled={processingSteps[`${company.id}-${step.id}`]}
                              >
                                {processingSteps[`${company.id}-${step.id}`] ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Processing...
                                  </>
                                ) : step.completed && step.id === 1 ? (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Details
                                  </>
                                ) : step.completed && step.id === 5 ? (
                                  'Re-publish'
                                ) : step.completed && step.id === 2 ? (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    View JSON
                                  </>
                                ) : step.completed && step.id === 6 ? (
                                  'Manage Screenshots'
                                ) : step.completed && step.id === 7 ? (
                                  'Manage Script'
                                ) : step.completed && step.id === 8 ? (
                                  'Manage Video'
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
                )}
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

      {/* Stripe Info Modal */}
      {stripeInfoModalCompany && (
        <StripeInfoModal
          companyId={stripeInfoModalCompany.id}
          companyName={stripeInfoModalCompany.name}
          onClose={() => setStripeInfoModalCompany(null)}
          onSuccess={async () => {
            await refreshCompanySteps(stripeInfoModalCompany.id);
            await fetchCompanies();
          }}
        />
      )}

      {/* Paste Intake Modal */}
      {pasteModalCompany && (
        <PasteIntakeModal
          companyId={pasteModalCompany.id}
          companyName={pasteModalCompany.name}
          onClose={() => setPasteModalCompany(null)}
          onSuccess={() => refreshCompanySteps(pasteModalCompany.id)}
        />
      )}

      {/* Reviews Modal */}
      {reviewsModalCompany && (
        <ReviewsModal
          companyId={reviewsModalCompany.id}
          companyName={reviewsModalCompany.name}
          onClose={() => setReviewsModalCompany(null)}
          onSuccess={() => refreshCompanySteps(reviewsModalCompany.id)}
        />
      )}

      {/* Media Modal */}
      {mediaModalCompany && (
        <MediaModal
          companyId={mediaModalCompany.id}
          companyName={mediaModalCompany.name}
          onClose={() => setMediaModalCompany(null)}
          onSuccess={() => refreshCompanySteps(mediaModalCompany.id)}
        />
      )}

      {/* Publish Webflow Modal */}
      {publishModalCompany && (
        <PublishWebflowModal
          companyId={publishModalCompany.id}
          companyName={publishModalCompany.name}
          onClose={() => setPublishModalCompany(null)}
          onSuccess={() => refreshCompanySteps(publishModalCompany.id)}
        />
      )}

      {/* Screenshots Modal */}
      {screenshotsModalCompany && (
        <ScreenshotsModal
          companyId={screenshotsModalCompany.id}
          companyName={screenshotsModalCompany.name}
          profileUrl={screenshotsModalCompany.profileUrl}
          onClose={() => setScreenshotsModalCompany(null)}
          onSuccess={() => refreshCompanySteps(screenshotsModalCompany.id)}
        />
      )}

      {/* Video Script Modal */}
      {videoScriptModalCompany && (
        <VideoScriptModal
          companyId={videoScriptModalCompany.id}
          companyName={videoScriptModalCompany.name}
          onClose={() => setVideoScriptModalCompany(null)}
          onSuccess={() => refreshCompanySteps(videoScriptModalCompany.id)}
        />
      )}

      {/* Video Upload Modal */}
      {videoModalCompany && (
        <VideoUploadModal
          companyId={videoModalCompany.id}
          companyName={videoModalCompany.name}
          onClose={() => setVideoModalCompany(null)}
          onSuccess={() => refreshCompanySteps(videoModalCompany.id)}
        />
      )}

      {/* Welcome Email Modal */}
      {welcomeEmailModalCompany && (
        <WelcomeEmailModal
          companyId={welcomeEmailModalCompany.id}
          companyName={welcomeEmailModalCompany.name}
          onClose={() => setWelcomeEmailModalCompany(null)}
          onSuccess={async () => {
            await refreshCompanySteps(welcomeEmailModalCompany.id);
            await fetchCompanies();
          }}
        />
      )}

      {/* View JSON Modal */}
      {viewJsonModal && viewJsonModal.json && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  ROMA JSON - {viewJsonModal?.companyName || 'Unknown Company'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  View the pasted intake JSON data
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewJsonModal(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-auto flex-1">
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {(() => {
                  try {
                    return JSON.stringify(viewJsonModal.json, null, 2);
                  } catch (e) {
                    return `Error displaying JSON: ${e instanceof Error ? e.message : 'Unknown error'}`;
                  }
                })()}
              </pre>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const jsonString = JSON.stringify(viewJsonModal.json, null, 2);
                    await navigator.clipboard.writeText(jsonString);
                    alert('✅ JSON copied to clipboard!');
                  } catch (e) {
                    console.error('Copy failed:', e);
                    // Fallback: Create a temporary textarea
                    const textarea = document.createElement('textarea');
                    textarea.value = JSON.stringify(viewJsonModal.json, null, 2);
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                      document.execCommand('copy');
                      alert('✅ JSON copied to clipboard!');
                    } catch (err) {
                      alert('❌ Failed to copy JSON');
                    }
                    document.body.removeChild(textarea);
                  }
                }}
              >
                Copy JSON
              </Button>
              <Button onClick={() => setViewJsonModal(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
