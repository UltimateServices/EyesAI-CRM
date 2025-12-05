'use client';
// BUILD VERSION: 2024-12-05-21:30 - Fixed what_to_expect scenarios

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Loader2, AlertCircle, CheckCircle2, ExternalLink, Upload, MapPin, Clock, Phone, Globe, Mail, Star } from 'lucide-react';
import { useStore } from '@/lib/store';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PublishWebflowModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PublishWebflowModal({ companyId, companyName, onClose, onSuccess }: PublishWebflowModalProps) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [intakeData, setIntakeData] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const companies = useStore((state) => state.companies);

  const company = companies.find(c => c.id === companyId);

  // Fetch data for checklist
  useEffect(() => {
    const fetchChecklistData = async () => {
      const supabase = createClientComponentClient();

      try {
        // Fetch intake data
        const intakeResponse = await fetch(`/api/intakes?companyId=${companyId}`);
        const intakeResult = await intakeResponse.json();

        if (intakeResult.success && intakeResult.intake?.roma_data) {
          setIntakeData(intakeResult.intake.roma_data);
        }

        // Fetch media items
        console.log('Fetching media for companyId:', companyId);
        const mediaResponse = await fetch(`/api/media?companyId=${companyId}`);
        const mediaResult = await mediaResponse.json();
        console.log('Media API response:', mediaResult);

        if (mediaResult.data) {
          console.log('Setting mediaItems:', mediaResult.data);
          setMediaItems(mediaResult.data);
        } else {
          console.error('Media fetch failed or no data:', mediaResult);
        }

        // Fetch reviews directly from database (don't filter by status - show all)
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('company_id', companyId);

        if (reviewsData) {
          setReviews(reviewsData);
        }
      } catch (err) {
        console.error('Error fetching checklist data:', err);
      } finally {
        setLoadingChecklist(false);
      }
    };
    fetchChecklistData();
  }, [companyId]);

  const handlePublish = async () => {
    setPublishing(true);
    setError('');

    try {
      const response = await fetch('/api/webflow/publish-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        throw new Error((data.error || 'Failed to publish to Webflow') + errorDetails);
      }

      setLiveUrl(data.liveUrl);
      setSlug(data.slug);
      setPublished(true);

      // Mark Step 5 as complete
      const stepResponse = await fetch(`/api/onboarding/steps/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: 5, completed: true }),
      });

      if (!stepResponse.ok) {
        throw new Error('Failed to mark step as complete');
      }

      // Don't auto-close, let VA click "Continue to Step 6"
    } catch (err: any) {
      setError(err.message || 'Failed to publish profile');
      setPublishing(false);
    }
  };

  const handleContinue = () => {
    onSuccess();
    onClose();
  };

  if (!company) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="p-6">
          <p className="text-red-600">Company not found</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Step 5: Publish to Webflow</h2>
              <p className="text-sm text-slate-600 mt-1">
                Company: <span className="font-semibold">{companyName}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={publishing}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {!published ? (
              <>
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Ready to Publish</h3>
                  <p className="text-sm text-blue-700">
                    This will publish {companyName}'s profile to the live EyesAI website. The profile will be accessible at:
                  </p>
                  <p className="text-sm text-blue-900 font-mono mt-2">
                    https://eyesai.ai/profile/{company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-...
                  </p>
                </div>

                {/* Loading State */}
                {loadingChecklist && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-600">Loading profile data...</span>
                  </div>
                )}

                {/* Webflow Sync Checklist */}
                {!loadingChecklist && (() => {
                  console.log('=== STEP 5 DEBUG ===');
                  console.log('mediaItems:', mediaItems);
                  console.log('mediaItems count:', mediaItems.length);
                  console.log('Active media:', mediaItems.filter(m => m.status === 'active'));

                  // Calculate counts for each section - handle both old and new ROMA formats
                  // Services - check both 'services_offered' and 'services'
                  const servicesCount = intakeData?.services_offered
                    ? Object.keys(intakeData.services_offered).filter(k => k.startsWith('service_') && intakeData.services_offered[k]?.title).length
                    : intakeData?.services
                      ? Object.keys(intakeData.services).filter(k => k.startsWith('service_') && intakeData.services[k]?.title).length
                      : 0;

                  const faqsCount = intakeData?.faqs ? Object.keys(intakeData.faqs).filter(k => k.startsWith('faq_') && intakeData.faqs[k]?.question).length : 0;

                  // Scenarios - it's an object with scenario_1, scenario_2, etc. keys
                  const scenariosCount = intakeData?.what_to_expect
                    ? Object.keys(intakeData.what_to_expect).filter(k => k.startsWith('scenario_') && intakeData.what_to_expect[k]?.title).length
                    : 0;

                  // Locations - check both formats
                  const locationsCount = intakeData?.locations
                    ? Object.keys(intakeData.locations).filter(k => k.startsWith('location_') && intakeData.locations[k]?.address_1).length
                    : intakeData?.locations_and_hours?.primary_location ? 1 : 0;

                  // Business info - check both old ROMA format (company_name) and new format (business_name)
                  const hasBusinessName = intakeData?.hero?.company_name || intakeData?.hero?.business_name || intakeData?.business_name || company?.name;
                  const hasTagline = intakeData?.hero?.tagline || intakeData?.tagline;
                  const hasCategory = intakeData?.hero?.category || intakeData?.category;

                  // Logo count from Step 4
                  const logoCount = mediaItems.filter(m => m.status === 'active' && (m.internal_tags?.includes('logo') || m.category === 'logo')).length;

                  // Gallery count from Step 4 (everything that's NOT a logo)
                  const galleryItemsFromMedia = mediaItems.filter(m => m.status === 'active' && !m.internal_tags?.includes('logo') && m.category !== 'logo');
                  const galleryCount = galleryItemsFromMedia.length;

                  const activeReviews = reviews;

                  return (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Webflow CMS Fields Ready to Sync</h3>

                      <div className="border rounded-lg divide-y">
                        {/* Business Info */}
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${hasBusinessName ? 'text-green-600' : 'text-slate-300'}`} />
                            <span className="font-medium text-sm">Business Information</span>
                          </div>
                          <span className="text-xs text-slate-600">
                            {hasBusinessName ? `${company.name}` : 'Missing'}
                            {hasTagline && ', Tagline'}
                            {hasCategory && ', Category'}
                          </span>
                        </div>

                        {/* Logo */}
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${logoCount > 0 ? 'text-green-600' : 'text-slate-300'}`} />
                            <span className="font-medium text-sm">Logo</span>
                          </div>
                          <span className="text-xs text-slate-600">{logoCount > 0 ? `${logoCount} image` : 'Missing'}</span>
                        </div>

                        {/* Gallery Images */}
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${galleryCount >= 5 ? 'text-green-600' : galleryCount > 0 ? 'text-yellow-500' : 'text-slate-300'}`} />
                            <span className="font-medium text-sm">Gallery Images</span>
                          </div>
                          <span className="text-xs text-slate-600">{galleryCount} images {galleryCount < 5 && `(min 5 recommended)`}</span>
                        </div>

                        {/* Reviews */}
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${activeReviews.length >= 5 ? 'text-green-600' : activeReviews.length > 0 ? 'text-yellow-500' : 'text-slate-300'}`} />
                            <span className="font-medium text-sm">Reviews</span>
                          </div>
                          <span className="text-xs text-slate-600">{activeReviews.length} reviews</span>
                        </div>

                        {/* Services */}
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${servicesCount > 0 ? 'text-green-600' : 'text-slate-300'}`} />
                            <span className="font-medium text-sm">Services</span>
                          </div>
                          <span className="text-xs text-slate-600">{servicesCount} services</span>
                        </div>

                        {/* FAQs */}
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${faqsCount > 0 ? 'text-green-600' : 'text-slate-300'}`} />
                            <span className="font-medium text-sm">FAQs</span>
                          </div>
                          <span className="text-xs text-slate-600">{faqsCount} FAQs</span>
                        </div>

                        {/* Scenarios */}
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${scenariosCount > 0 ? 'text-green-600' : 'text-slate-300'}`} />
                            <span className="font-medium text-sm">Use Case Scenarios</span>
                          </div>
                          <span className="text-xs text-slate-600">{scenariosCount} scenarios</span>
                        </div>

                        {/* Locations */}
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${locationsCount > 0 ? 'text-green-600' : 'text-slate-300'}`} />
                            <span className="font-medium text-sm">Locations</span>
                          </div>
                          <span className="text-xs text-slate-600">{locationsCount} location</span>
                        </div>
                      </div>

                      {/* Show gallery preview if images exist - ONLY from Step 4 */}
                      {galleryCount > 0 && (
                        <div className="border rounded-lg p-3">
                          <h4 className="font-semibold text-sm text-slate-900 mb-2">
                            Gallery Preview (from Step 4 Media Library)
                          </h4>
                          <div className="grid grid-cols-5 gap-2">
                            {galleryItemsFromMedia.slice(0, 5).map((item: any) => (
                              <div key={item.id} className="aspect-square bg-slate-100 rounded overflow-hidden">
                                <img
                                  src={item.file_url}
                                  alt={item.alt_text || 'Gallery image'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          {galleryCount > 5 && (
                            <p className="text-xs text-slate-500 mt-2">+{galleryCount - 5} more images</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Fallback if no data */}
                {!loadingChecklist && !intakeData && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-slate-900">Basic Profile Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-600">Business Name:</span>
                        <p className="font-medium">{company.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-600">Plan:</span>
                        <p className="font-medium">{company.plan}</p>
                      </div>
                      {company.website && (
                        <div>
                          <span className="text-slate-600">Website:</span>
                          <p className="font-medium">{company.website}</p>
                        </div>
                      )}
                      {company.city && company.state && (
                        <div>
                          <span className="text-slate-600">Location:</span>
                          <p className="font-medium">{company.city}, {company.state}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Publishing Failed</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Profile Published Successfully!</p>
                    <p className="text-sm mt-1">
                      {companyName}'s profile is now live on the EyesAI website.
                    </p>
                  </div>
                </div>

                {/* Live URL */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Live Profile URL</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={liveUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(liveUrl)}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(liveUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Next Steps</h3>
                  <p className="text-sm text-slate-600">
                    Click "Continue to Step 6" to capture screenshots of the live profile for review and documentation.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t mt-6 sticky bottom-0 bg-white">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={publishing}
            >
              Close
            </Button>
            {!published ? (
              <Button
                onClick={handlePublish}
                disabled={publishing}
                className="gap-2"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publishing to Webflow...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Publish to Webflow
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleContinue}
                className="gap-2"
              >
                Continue to Step 6
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
