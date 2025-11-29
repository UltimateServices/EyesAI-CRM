'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, X, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';

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

  const isMissing = (value: any): boolean => {
    if (value === null || value === undefined || value === '' || value === '<>') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  };

  const getFieldClass = (value: any): string => {
    return isMissing(value)
      ? 'w-full px-3 py-2 border border-red-300 bg-red-50 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500'
      : 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
  };

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
              <h2 className="text-2xl font-bold text-slate-900">Step 2: Paste Intake JSON</h2>
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
                  <p className="text-sm">JSON validated successfully! Click "Preview & Edit" to review all sections.</p>
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
                  Preview & Edit All Sections
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
            /* Preview/Edit Mode - All 10 Sections */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Review all sections below. Fields highlighted in <span className="text-red-600 font-semibold">red</span> are missing data.
                  Edit any field before saving. All data will be migrated to the companies table.
                </p>
              </div>

              {/* Section 1: Category */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">1. Category</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category {isMissing(parsedData?.category) && <span className="text-red-600">(Missing)</span>}
                  </label>
                  <Input
                    value={parsedData?.category || ''}
                    onChange={(e) => updateField('category', e.target.value)}
                    className={getFieldClass(parsedData?.category)}
                    placeholder="e.g., Beauty & Personal Care"
                  />
                </div>
              </Card>

              {/* Section 2: Hero */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">2. Hero Section</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Business Name {isMissing(parsedData?.hero?.business_name) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.hero?.business_name || ''}
                      onChange={(e) => updateField('hero.business_name', e.target.value)}
                      className={getFieldClass(parsedData?.hero?.business_name)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tagline {isMissing(parsedData?.hero?.tagline) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.hero?.tagline || ''}
                      onChange={(e) => updateField('hero.tagline', e.target.value)}
                      className={getFieldClass(parsedData?.hero?.tagline)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Hero Image URL {isMissing(parsedData?.hero?.hero_image_url) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.hero?.hero_image_url || ''}
                      onChange={(e) => updateField('hero.hero_image_url', e.target.value)}
                      className={getFieldClass(parsedData?.hero?.hero_image_url)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <Input
                      value={parsedData?.hero?.quick_actions?.call_tel || ''}
                      onChange={(e) => updateField('hero.quick_actions.call_tel', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                    <Input
                      value={parsedData?.hero?.quick_actions?.website_url || ''}
                      onChange={(e) => updateField('hero.quick_actions.website_url', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <Input
                      value={parsedData?.hero?.quick_actions?.email_mailto || ''}
                      onChange={(e) => updateField('hero.quick_actions.email_mailto', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Maps Link</label>
                    <Input
                      value={parsedData?.hero?.quick_actions?.maps_link || ''}
                      onChange={(e) => updateField('hero.quick_actions.maps_link', e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 3: About & Badges */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">3. About & Badges</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      About Summary (120 words) {isMissing(parsedData?.about_and_badges?.ai_summary_120w) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <textarea
                      value={parsedData?.about_and_badges?.ai_summary_120w || ''}
                      onChange={(e) => updateField('about_and_badges.ai_summary_120w', e.target.value)}
                      className={getFieldClass(parsedData?.about_and_badges?.ai_summary_120w) + ' h-32'}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 4: Services */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">
                  4. Services
                  {isMissing(parsedData?.services) && <span className="text-red-600"> (Missing)</span>}
                  {parsedData?.services && <span className="text-slate-600 text-sm ml-2">({parsedData.services.length} services)</span>}
                </h3>
                <div className="text-sm text-slate-600">
                  {parsedData?.services?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {parsedData.services.slice(0, 5).map((svc: any, idx: number) => (
                        <li key={idx}>{svc.title || svc.name || 'Untitled Service'}</li>
                      ))}
                      {parsedData.services.length > 5 && (
                        <li className="text-slate-500">... and {parsedData.services.length - 5} more</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-red-600">No services found</p>
                  )}
                </div>
              </Card>

              {/* Section 5: What to Expect */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">
                  5. What to Expect
                  {parsedData?.what_to_expect && <span className="text-slate-600 text-sm ml-2">({parsedData.what_to_expect.length} cards)</span>}
                </h3>
                <div className="text-sm text-slate-600">
                  {parsedData?.what_to_expect?.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {parsedData.what_to_expect.map((card: any, idx: number) => (
                        <li key={idx}>{card.title || 'Untitled Card'}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">No cards found</p>
                  )}
                </div>
              </Card>

              {/* Section 6: Pricing */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">6. Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
                    <Input
                      value={parsedData?.pricing_information?.headline || ''}
                      onChange={(e) => updateField('pricing_information.headline', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subheadline</label>
                    <Input
                      value={parsedData?.pricing_information?.subheadline || ''}
                      onChange={(e) => updateField('pricing_information.subheadline', e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 7: Get in Touch */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">7. Get in Touch</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
                    <Input
                      value={parsedData?.get_in_touch?.headline || ''}
                      onChange={(e) => updateField('get_in_touch.headline', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subheadline</label>
                    <Input
                      value={parsedData?.get_in_touch?.subheadline || ''}
                      onChange={(e) => updateField('get_in_touch.subheadline', e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 8: Locations & Hours */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">8. Locations & Hours</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Street Address {isMissing(parsedData?.locations_and_hours?.primary_location?.street_address) && <span className="text-red-600">(Missing)</span>}
                      </label>
                      <Input
                        value={parsedData?.locations_and_hours?.primary_location?.street_address || ''}
                        onChange={(e) => updateField('locations_and_hours.primary_location.street_address', e.target.value)}
                        className={getFieldClass(parsedData?.locations_and_hours?.primary_location?.street_address)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        City {isMissing(parsedData?.locations_and_hours?.primary_location?.city) && <span className="text-red-600">(Missing)</span>}
                      </label>
                      <Input
                        value={parsedData?.locations_and_hours?.primary_location?.city || ''}
                        onChange={(e) => updateField('locations_and_hours.primary_location.city', e.target.value)}
                        className={getFieldClass(parsedData?.locations_and_hours?.primary_location?.city)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        State {isMissing(parsedData?.locations_and_hours?.primary_location?.state) && <span className="text-red-600">(Missing)</span>}
                      </label>
                      <Input
                        value={parsedData?.locations_and_hours?.primary_location?.state || ''}
                        onChange={(e) => updateField('locations_and_hours.primary_location.state', e.target.value)}
                        className={getFieldClass(parsedData?.locations_and_hours?.primary_location?.state)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">ZIP Code</label>
                      <Input
                        value={parsedData?.locations_and_hours?.primary_location?.zip || ''}
                        onChange={(e) => updateField('locations_and_hours.primary_location.zip', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Section 9: FAQs */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">
                  9. FAQs
                  {isMissing(parsedData?.faqs?.all_questions) && <span className="text-red-600"> (Missing)</span>}
                </h3>
                <div className="text-sm text-slate-600">
                  {parsedData?.faqs?.all_questions ? (
                    <div className="space-y-2">
                      {Object.entries(parsedData.faqs.all_questions).map(([category, questions]: [string, any]) => (
                        <div key={category}>
                          <p className="font-semibold">{category}: <span className="font-normal">{Array.isArray(questions) ? questions.length : 0} questions</span></p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-600">No FAQs found</p>
                  )}
                </div>
              </Card>

              {/* Section 10: Reviews & Gallery */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">10. Reviews & Photo Gallery</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Featured Reviews</p>
                    <p className="text-sm text-slate-600">
                      {parsedData?.featured_reviews?.items?.length || 0} reviews found
                      {parsedData?.featured_reviews?.items?.length > 0 && ' (will be extracted to Step 3)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Photo Gallery</p>
                    <p className="text-sm text-slate-600">
                      {parsedData?.photo_gallery?.images?.length || 0} images found
                      {parsedData?.photo_gallery?.images?.length > 0 && ' (will be extracted to Step 4)'}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Ready to save?</span> All data will be saved to the database and migrated to the companies table.
                  Reviews and images will be automatically extracted for Steps 3 and 4.
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
