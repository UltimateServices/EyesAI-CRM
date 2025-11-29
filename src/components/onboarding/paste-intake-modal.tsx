'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PasteIntakeModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PasteIntakeModal({ companyId, companyName, onClose, onSuccess }: PasteIntakeModalProps) {
  const [pastedJSON, setPastedJSON] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handlePaste = (value: string) => {
    setPastedJSON(value);
    setError('');
    setParsedData(null);
    setShowPreview(false);

    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('Invalid JSON format - must be an object');
        return;
      }
      setParsedData(parsed);
    } catch (err) {
      setError('Invalid JSON format - please check your input');
    }
  };

  const handlePreview = () => {
    if (!parsedData) {
      setError('Please paste valid JSON first');
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (!parsedData) {
      setError('Please paste valid JSON first');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/paste-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          romaData: parsedData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save intake data');
      }

      const extracted = data.extracted || { reviews: 0, media: 0 };
      alert(`✅ Intake saved and migrated successfully! Step 2 completed.\n\nExtracted:\n• ${extracted.reviews} review${extracted.reviews !== 1 ? 's' : ''}\n• ${extracted.media} media item${extracted.media !== 1 ? 's' : ''}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save intake');
      setSubmitting(false);
    }
  };

  // Extract preview data from the correct paths
  const getPreviewData = () => {
    if (!parsedData) return null;

    // Helper to safely get nested values
    const get = (path: string) => {
      return path.split('.').reduce((obj, key) => obj?.[key], parsedData);
    };

    return {
      // Category
      category: parsedData.category || 'N/A',

      // Hero Section
      businessName: get('hero.business_name') || get('hero.company_name') || get('hero.name') || 'N/A',
      tagline: get('hero.tagline') || get('hero.primary_tagline') || get('hero.slogan') || 'N/A',
      heroImage: get('hero.hero_image_url') || get('hero.logo_url') || get('hero.image') || 'N/A',
      badges: Array.isArray(get('hero.badges')) ? get('hero.badges') : (get('hero.badges') ? [get('hero.badges')] : []),

      // Contact from hero.quick_actions
      phone: get('hero.quick_actions.call_tel') || get('footer.phone_e164') || 'N/A',
      email: get('hero.quick_actions.email_mailto') || get('footer.email') || 'N/A',
      website: get('hero.quick_actions.website_url') || get('footer.website') || 'N/A',
      mapsLink: get('hero.quick_actions.maps_link') || get('hero.quick_actions.maps_url') || 'N/A',

      // About
      about: get('about_and_badges.ai_summary_120w') || get('about_and_badges.about_text') || 'N/A',
      companyBadges: get('about_and_badges.company_badges') || [],

      // Location from locations_and_hours.primary_location
      address: get('locations_and_hours.primary_location.street_address') || get('locations_and_hours.primary_location.address') || 'N/A',
      city: get('locations_and_hours.primary_location.city') || 'N/A',
      state: get('locations_and_hours.primary_location.state') || 'N/A',
      zip: get('locations_and_hours.primary_location.zip') || get('locations_and_hours.primary_location.postal_code') || 'N/A',

      // Services count
      servicesCount: Array.isArray(parsedData.services) ? parsedData.services.length : 0,

      // FAQs count
      faqsCount: parsedData.faqs?.all_questions ? Object.values(parsedData.faqs.all_questions).reduce((sum: number, cat: any) => sum + (Array.isArray(cat) ? cat.length : 0), 0) : 0,
    };
  };

  const preview = getPreviewData();

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(parsedData));

    let current = newData;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    setParsedData(newData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Paste Intake JSON</h2>
              <p className="text-sm text-slate-600 mt-1">
                Company: <span className="font-semibold">{companyName}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Paste Area */}
          {!showPreview ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Paste ROMA JSON here
                </label>
                <textarea
                  value={pastedJSON}
                  onChange={(e) => handlePaste(e.target.value)}
                  placeholder='{"category": "...", "hero": {...}, "about_and_badges": {...}, ...}'
                  className="w-full h-64 p-4 border rounded-lg font-mono text-sm"
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {parsedData && !error && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">JSON validated successfully! Click "Preview & Edit" to review.</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!parsedData || submitting}
                >
                  Preview & Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!parsedData || submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving & Migrating...
                    </>
                  ) : (
                    'Save & Complete Step 2'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Preview/Edit Mode */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Review the extracted key fields below. You can edit any field before saving.
                  The complete data will be saved and migrated to the companies table.
                  <br />
                  <span className="font-semibold mt-2 block">Found: {preview?.servicesCount || 0} services, {preview?.faqsCount || 0} FAQs</span>
                </p>
              </div>

              {/* Section 1: Category */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">1. Category & Overview</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <Input
                      value={preview?.category || ''}
                      onChange={(e) => updateField('category', e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 2: Hero */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">2. Hero Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                    <Input
                      value={preview?.businessName || ''}
                      onChange={(e) => updateField('hero.business_name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                    <Input
                      value={preview?.tagline || ''}
                      onChange={(e) => updateField('hero.tagline', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Hero Image URL</label>
                    <Input
                      value={preview?.heroImage || ''}
                      onChange={(e) => updateField('hero.hero_image_url', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Badges (comma-separated)</label>
                    <Input
                      value={Array.isArray(preview?.badges) ? preview.badges.join(', ') : ''}
                      onChange={(e) => updateField('hero.badges', e.target.value.split(',').map((b: string) => b.trim()))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <Input
                      value={preview?.phone || ''}
                      onChange={(e) => updateField('hero.quick_actions.call_tel', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                    <Input
                      value={preview?.website || ''}
                      onChange={(e) => updateField('hero.quick_actions.website_url', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <Input
                      value={preview?.email || ''}
                      onChange={(e) => updateField('hero.quick_actions.email_mailto', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Maps Link</label>
                    <Input
                      value={preview?.mapsLink || ''}
                      onChange={(e) => updateField('hero.quick_actions.maps_link', e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 3: About */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">3. About & Badges</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">About Summary (120 words)</label>
                    <textarea
                      value={preview?.about || ''}
                      onChange={(e) => updateField('about_and_badges.ai_summary_120w', e.target.value)}
                      className="w-full h-32 p-3 border rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Badges (comma-separated)</label>
                    <Input
                      value={Array.isArray(preview?.companyBadges) ? preview.companyBadges.join(', ') : ''}
                      onChange={(e) => updateField('about_and_badges.company_badges', e.target.value.split(',').map((b: string) => b.trim()))}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 4: Location */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">8. Location & Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                    <Input
                      value={preview?.address || ''}
                      onChange={(e) => updateField('locations_and_hours.primary_location.street_address', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <Input
                      value={preview?.city || ''}
                      onChange={(e) => updateField('locations_and_hours.primary_location.city', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <Input
                      value={preview?.state || ''}
                      onChange={(e) => updateField('locations_and_hours.primary_location.state', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                    <Input
                      value={preview?.zip || ''}
                      onChange={(e) => updateField('locations_and_hours.primary_location.zip', e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Note:</span> This preview shows the key fields from the ROMA-PDF data.
                  The complete JSON including services ({preview?.servicesCount}), FAQs ({preview?.faqsCount}), reviews, and all other sections
                  will be saved to the database. After saving, the migration will extract all data to the companies table.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setError('');
                  }}
                  disabled={submitting}
                >
                  Back to Paste
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving & Migrating...
                    </>
                  ) : (
                    'Save & Complete Step 2'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
