'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Loader2, AlertCircle, CheckCircle2, ExternalLink, Upload, MapPin, Clock, Phone, Globe, Mail, Star } from 'lucide-react';
import { useStore } from '@/lib/store';

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
  const [loadingIntake, setLoadingIntake] = useState(true);
  const companies = useStore((state) => state.companies);

  const company = companies.find(c => c.id === companyId);

  // Fetch intake data for full preview
  useEffect(() => {
    const fetchIntakeData = async () => {
      try {
        const response = await fetch(`/api/intakes?companyId=${companyId}`);
        const data = await response.json();
        if (data.success && data.intake?.roma_data) {
          setIntakeData(data.intake.roma_data);
        }
      } catch (err) {
        console.error('Error fetching intake data:', err);
      } finally {
        setLoadingIntake(false);
      }
    };
    fetchIntakeData();
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
        throw new Error(data.error || 'Failed to publish to Webflow');
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
                {loadingIntake && (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-600">Loading profile data...</span>
                  </div>
                )}

                {/* Full Profile Preview */}
                {!loadingIntake && intakeData && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Profile Preview</h3>

                    {/* Hero Section */}
                    {intakeData.hero && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Hero Section
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="col-span-2">
                            <span className="text-slate-600">Business Name:</span>
                            <p className="font-medium">{intakeData.hero.business_name}</p>
                          </div>
                          {intakeData.hero.tagline && (
                            <div className="col-span-2">
                              <span className="text-slate-600">Tagline:</span>
                              <p className="font-medium italic">{intakeData.hero.tagline}</p>
                            </div>
                          )}
                          {intakeData.hero.quick_actions && (
                            <>
                              {intakeData.hero.quick_actions.call_tel && (
                                <div>
                                  <span className="text-slate-600 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Phone:
                                  </span>
                                  <p className="font-medium">{intakeData.hero.quick_actions.call_tel.replace('tel:', '')}</p>
                                </div>
                              )}
                              {intakeData.hero.quick_actions.website_url && (
                                <div>
                                  <span className="text-slate-600 flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Website:
                                  </span>
                                  <p className="font-medium truncate">{intakeData.hero.quick_actions.website_url}</p>
                                </div>
                              )}
                              {intakeData.hero.quick_actions.email_mailto && (
                                <div>
                                  <span className="text-slate-600 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Email:
                                  </span>
                                  <p className="font-medium">{intakeData.hero.quick_actions.email_mailto.replace('mailto:', '')}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* About & AI Summary */}
                    {intakeData.about_and_badges && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-900">About & Summary</h4>
                        {intakeData.about_and_badges.about_text && (
                          <div>
                            <span className="text-slate-600 text-sm">About:</span>
                            <p className="text-sm mt-1">{intakeData.about_and_badges.about_text}</p>
                          </div>
                        )}
                        {intakeData.about_and_badges.ai_summary_120w && (
                          <div>
                            <span className="text-slate-600 text-sm">AI Summary:</span>
                            <p className="text-sm mt-1 italic">{intakeData.about_and_badges.ai_summary_120w}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Services */}
                    {intakeData.services_offered && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-900">Services Offered</h4>
                        <div className="space-y-2">
                          {Object.entries(intakeData.services_offered).map(([key, service]: [string, any]) => {
                            if (key.startsWith('service_') && service.title) {
                              return (
                                <div key={key} className="bg-slate-50 p-3 rounded">
                                  <p className="font-medium text-sm">{service.title}</p>
                                  {service.description && (
                                    <p className="text-xs text-slate-600 mt-1">{service.description}</p>
                                  )}
                                  {service.starting_price && (
                                    <p className="text-xs text-green-700 font-semibold mt-1">
                                      Starting at: {service.starting_price}
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* FAQs */}
                    {intakeData.faqs && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-900">Frequently Asked Questions</h4>
                        <div className="space-y-2">
                          {Object.entries(intakeData.faqs).map(([key, faq]: [string, any]) => {
                            if (key.startsWith('faq_') && faq.question) {
                              return (
                                <div key={key} className="bg-slate-50 p-3 rounded">
                                  <p className="font-medium text-sm">{faq.question}</p>
                                  {faq.answer && (
                                    <p className="text-xs text-slate-600 mt-1">{faq.answer}</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Scenarios */}
                    {intakeData.scenarios_and_tips && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-900">Use Case Scenarios</h4>
                        <div className="space-y-2">
                          {Object.entries(intakeData.scenarios_and_tips).map(([key, scenario]: [string, any]) => {
                            if (key.startsWith('scenario_') && scenario.heading) {
                              return (
                                <div key={key} className="bg-slate-50 p-3 rounded">
                                  <p className="font-medium text-sm">{scenario.heading}</p>
                                  {scenario.pro_tip && (
                                    <p className="text-xs text-blue-700 mt-1 italic">💡 Pro Tip: {scenario.pro_tip}</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Locations & Hours */}
                    {intakeData.locations_and_hours?.primary_location && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location & Hours
                        </h4>
                        <div className="bg-slate-50 p-3 rounded space-y-2">
                          <div>
                            <span className="text-slate-600 text-sm">Address:</span>
                            <p className="text-sm">{intakeData.locations_and_hours.primary_location.street_address}</p>
                            <p className="text-sm">
                              {intakeData.locations_and_hours.primary_location.city}, {intakeData.locations_and_hours.primary_location.state} {intakeData.locations_and_hours.primary_location.zip}
                            </p>
                          </div>
                          {intakeData.locations_and_hours.primary_location.hours_summary && (
                            <div>
                              <span className="text-slate-600 text-sm flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Hours:
                              </span>
                              <p className="text-sm">{intakeData.locations_and_hours.primary_location.hours_summary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Featured Reviews */}
                    {intakeData.featured_reviews && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-900">Featured Reviews</h4>
                        <div className="space-y-2">
                          {Object.entries(intakeData.featured_reviews).map(([key, review]: [string, any]) => {
                            if (key.startsWith('review_') && review.reviewer) {
                              return (
                                <div key={key} className="bg-slate-50 p-3 rounded">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm">{review.reviewer}</p>
                                    {review.stars && (
                                      <div className="flex items-center text-yellow-500">
                                        {Array.from({ length: review.stars }).map((_, i) => (
                                          <Star key={i} className="w-3 h-3 fill-current" />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {review.excerpt && (
                                    <p className="text-xs text-slate-600">{review.excerpt}</p>
                                  )}
                                  {review.source && (
                                    <p className="text-xs text-slate-500 mt-1">Source: {review.source}</p>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Photo Gallery */}
                    {intakeData.photo_gallery && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <h4 className="font-semibold text-slate-900">Photo Gallery</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(intakeData.photo_gallery).map(([key, image]: [string, any]) => {
                            if (key.startsWith('image_') && image.url && image.url !== '<>') {
                              return (
                                <div key={key} className="aspect-square bg-slate-100 rounded overflow-hidden">
                                  <img
                                    src={image.url}
                                    alt={image.alt || 'Gallery image'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback if no intake data */}
                {!loadingIntake && !intakeData && (
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
