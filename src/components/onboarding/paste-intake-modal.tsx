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

  // Flatten nested JSON structure to match CMS field names
  const flattenJSON = (data: any): any => {
    const flattened: any = {};

    // Hero section
    if (data.hero) {
      flattened.company_name = data.hero.company_name;
      flattened.company_logo = data.hero.company_logo;
      flattened.ai_summary = data.hero.ai_summary;
      flattened.slug = data.hero.slug;
      flattened.verification_status = data.hero.verification_status;
      flattened.category = data.hero.category;
      flattened.tagline = data.hero.tagline;
      flattened.phone = data.hero.phone;
      flattened.website_url = data.hero.website_url;
      flattened.email = data.hero.email;
      flattened.maps_link = data.hero.maps_link;
      flattened.ai_signal_1 = data.hero.ai_signal_1;
      flattened.ai_signal_2 = data.hero.ai_signal_2;
      flattened.ai_signal_3 = data.hero.ai_signal_3;
      flattened.ai_signal_4 = data.hero.ai_signal_4;
    }

    // About section
    if (data.about) {
      flattened.about_title = data.about.about_title;
      flattened.about_text = data.about.about_text;
      flattened.about_badge_1 = data.about.about_badge_1;
      flattened.about_badge_2 = data.about.about_badge_2;
      flattened.about_badge_3 = data.about.about_badge_3;
      flattened.about_badge_4 = data.about.about_badge_4;
    }

    // Services section
    if (data.services) {
      flattened.services_title = data.services.services_title;
      flattened.services_section_title = data.services.services_section_title;

      // Flatten service_1 through service_5
      for (let i = 1; i <= 5; i++) {
        const service = data.services[`service_${i}`];
        if (service) {
          flattened[`service_${i}_emoji`] = service.emoji;
          flattened[`service_${i}_title`] = service.title;
          flattened[`service_${i}_price`] = service.price;
          flattened[`service_${i}_description`] = service.description;
          flattened[`service_${i}_duration`] = service.duration;
          flattened[`service_${i}_included_1`] = service.included_1;
          flattened[`service_${i}_included_2`] = service.included_2;
          flattened[`service_${i}_included_3`] = service.included_3;
          flattened[`service_${i}_included_4`] = service.included_4;
        }
      }
    }

    // Quick Reference Guide section
    if (data.quick_reference_guide) {
      flattened.qrg_column_1 = data.quick_reference_guide.column_1;
      flattened.qrg_column_2 = data.quick_reference_guide.column_2;
      flattened.qrg_column_3 = data.quick_reference_guide.column_3;
      flattened.qrg_column_4 = data.quick_reference_guide.column_4;
      flattened.qrg_column_5 = data.quick_reference_guide.column_5;

      for (let r = 1; r <= 5; r++) {
        const row = data.quick_reference_guide[`row_${r}`];
        if (row) {
          for (let c = 1; c <= 5; c++) {
            flattened[`qrg_row_${r}_col_${c}`] = row[`col_${c}`];
          }
        }
      }
    }

    // Pricing Information section
    if (data.pricing_information) {
      flattened.pricing_summary = data.pricing_information.pricing_summary;
      flattened.pricing_cta_1 = data.pricing_information.pricing_cta_1;
      flattened.pricing_cta_2 = data.pricing_information.pricing_cta_2;
    }

    // What to Expect section
    if (data.what_to_expect) {
      for (let i = 1; i <= 5; i++) {
        const scenario = data.what_to_expect[`scenario_${i}`];
        if (scenario) {
          flattened[`scenario_${i}_title`] = scenario.title;
          flattened[`scenario_${i}_recommended`] = scenario.recommended;
          flattened[`scenario_${i}_pro_tip`] = scenario.pro_tip;
          flattened[`scenario_${i}_involved_1`] = scenario.involved_1;
          flattened[`scenario_${i}_involved_2`] = scenario.involved_2;
          flattened[`scenario_${i}_involved_3`] = scenario.involved_3;
          flattened[`scenario_${i}_involved_4`] = scenario.involved_4;
        }
      }
    }

    // Locations section
    if (data.locations) {
      for (let i = 1; i <= 6; i++) {
        const location = data.locations[`location_${i}`];
        if (location) {
          flattened[`location_${i}_address_1`] = location.address_1;
          flattened[`location_${i}_address_2`] = location.address_2;
          flattened[`location_${i}_directions_url`] = location.directions_url;
          flattened[`location_${i}_hours_mon`] = location.hours_mon;
          flattened[`location_${i}_hours_tue`] = location.hours_tue;
          flattened[`location_${i}_hours_wed`] = location.hours_wed;
          flattened[`location_${i}_hours_thu`] = location.hours_thu;
          flattened[`location_${i}_hours_fri`] = location.hours_fri;
          flattened[`location_${i}_hours_sat`] = location.hours_sat;
          flattened[`location_${i}_hours_sun`] = location.hours_sun;
          flattened[`location_${i}_service_area`] = location.service_area;
        }
      }
    }

    // FAQs section
    if (data.faqs) {
      for (let i = 1; i <= 5; i++) {
        const faq = data.faqs[`faq_${i}`];
        if (faq) {
          flattened[`faq_${i}_question`] = faq.question;
          flattened[`faq_${i}_answer`] = faq.answer;
        }
      }
    }

    // Get in Touch section
    if (data.get_in_touch) {
      flattened.city_state = data.get_in_touch.city_state;
      flattened.footer_address = data.get_in_touch.footer_address;
      flattened.social_facebook = data.get_in_touch.social_facebook;
      flattened.social_instagram = data.get_in_touch.social_instagram;
      flattened.social_youtube = data.get_in_touch.social_youtube;
    }

    // Photo Gallery section
    if (data.photo_gallery) {
      for (let i = 1; i <= 5; i++) {
        const image = data.photo_gallery[`image_${i}`];
        if (image) {
          flattened[`gallery_image_${i}`] = image.url;
          flattened[`gallery_image_${i}_alt`] = image.alt;
        }
      }
    }

    // Featured Reviews section
    if (data.featured_reviews) {
      for (let i = 1; i <= 5; i++) {
        const review = data.featured_reviews[`review_${i}`];
        if (review) {
          flattened[`review_${i}_reviewer`] = review.reviewer;
          flattened[`review_${i}_date`] = review.date;
          flattened[`review_${i}_excerpt`] = review.excerpt;
          flattened[`review_${i}_source`] = review.source;
          flattened[`review_${i}_url`] = review.url;
        }
      }
    }

    // SEO/Schema section
    if (data.seo_schema) {
      flattened.seo_meta_title = data.seo_schema.seo_meta_title;
      flattened.seo_meta_description = data.seo_schema.seo_meta_description;
      flattened.seo_h1 = data.seo_schema.seo_h1;
      flattened.seo_h2_1 = data.seo_schema.seo_h2_1;
      flattened.seo_h2_2 = data.seo_schema.seo_h2_2;
      flattened.seo_h2_3 = data.seo_schema.seo_h2_3;
      flattened.seo_h2_4 = data.seo_schema.seo_h2_4;
      flattened.seo_og_title = data.seo_schema.seo_og_title;
      flattened.seo_og_description = data.seo_schema.seo_og_description;
      flattened.seo_og_image = data.seo_schema.seo_og_image;
      flattened.seo_jsonld = data.seo_schema.seo_jsonld;
      flattened.seo_robots = data.seo_schema.seo_robots;
      flattened.seo_canonical = data.seo_schema.seo_canonical;
    }

    // Keep the original nested structure for API submission
    flattened._original = data;

    return flattened;
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

      // Flatten the nested structure for display
      const flattened = flattenJSON(parsed);
      setParsedData(flattened);
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
      // Use the original nested structure for API submission
      const dataToSubmit = parsedData._original || parsedData;

      const response = await fetch('/api/onboarding/paste-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          romaData: dataToSubmit,
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
      <Card className="max-w-7xl w-full max-h-[90vh] overflow-y-auto my-8">
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
                  placeholder='{"category": "...", "hero": {...}, ...}'
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
                  <p className="text-sm">JSON validated! Click "Preview All 13 Sections" to review 267 fields.</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={handlePreview} disabled={!parsedData || submitting}>
                  Preview All 13 Sections
                </Button>
                <Button onClick={handleSubmit} disabled={!parsedData || submitting} className="gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save & Complete Step 2'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Preview Mode - All 13 Sections */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Review all 13 sections (267 total fields). Fields highlighted in <span className="text-red-600 font-semibold">red</span> are missing data.
                  Missing fields will show <code>&lt;&gt;</code> as placeholder.
                </p>
              </div>

              {/* Section 1: Hero (17 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 1: Hero (17 Fields)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company Name {isMissing(parsedData?.company_name) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.company_name || ''}
                      onChange={(e) => updateField('company_name', e.target.value)}
                      className={getFieldClass(parsedData?.company_name)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category {isMissing(parsedData?.category) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.category || ''}
                      onChange={(e) => updateField('category', e.target.value)}
                      className={getFieldClass(parsedData?.category)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tagline {isMissing(parsedData?.tagline) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.tagline || ''}
                      onChange={(e) => updateField('tagline', e.target.value)}
                      className={getFieldClass(parsedData?.tagline)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      AI Summary (35 words max) {isMissing(parsedData?.ai_summary) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <textarea
                      value={parsedData?.ai_summary || ''}
                      onChange={(e) => updateField('ai_summary', e.target.value)}
                      className={getFieldClass(parsedData?.ai_summary) + ' h-20'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <Input
                      value={parsedData?.phone || ''}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                    <Input
                      value={parsedData?.website_url || ''}
                      onChange={(e) => updateField('website_url', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <Input
                      value={parsedData?.email || ''}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Maps Link</label>
                    <Input
                      value={parsedData?.maps_link || ''}
                      onChange={(e) => updateField('maps_link', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company Logo URL {isMissing(parsedData?.company_logo) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.company_logo || ''}
                      onChange={(e) => updateField('company_logo', e.target.value)}
                      className={getFieldClass(parsedData?.company_logo)}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 2: About (6 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 2: About (6 Fields)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      About Text (150 words max) {isMissing(parsedData?.about_text) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <textarea
                      value={parsedData?.about_text || ''}
                      onChange={(e) => updateField('about_text', e.target.value)}
                      className={getFieldClass(parsedData?.about_text) + ' h-32'}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Badge 1</label>
                      <Input
                        value={parsedData?.about_badge_1 || ''}
                        onChange={(e) => updateField('about_badge_1', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Badge 2</label>
                      <Input
                        value={parsedData?.about_badge_2 || ''}
                        onChange={(e) => updateField('about_badge_2', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Badge 3</label>
                      <Input
                        value={parsedData?.about_badge_3 || ''}
                        onChange={(e) => updateField('about_badge_3', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Badge 4</label>
                      <Input
                        value={parsedData?.about_badge_4 || ''}
                        onChange={(e) => updateField('about_badge_4', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Section 3: Services (47 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 3: Services (47 Fields - 5 Services)</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Services Section Title</label>
                      <Input
                        value={parsedData?.services_section_title || ''}
                        onChange={(e) => updateField('services_section_title', e.target.value)}
                        placeholder="e.g., Services, Menu, Treatments, etc."
                      />
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="mb-4 p-3 bg-white rounded border">
                        <p className="font-semibold mb-2">Service {n}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <p>• Title: {parsedData?.[`service_${n}_title`] || '<>'}</p>
                          <p>• Price: {parsedData?.[`service_${n}_price`] || '<>'}</p>
                          <p>• Duration: {parsedData?.[`service_${n}_duration`] || '<>'}</p>
                          <p>• Description: {parsedData?.[`service_${n}_description`] ? '✓' : '<>'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Section 4: Quick Reference Guide (30 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 4: Quick Reference Guide (30 Fields - 5×5 Table)</h3>
                <div className="text-sm text-slate-600">
                  <p className="mb-2">Column Headers:</p>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="p-2 bg-white rounded border text-xs">
                        {parsedData?.[`qrg_column_${n}`] || `Col ${n}`}
                      </div>
                    ))}
                  </div>
                  <p>5 rows × 5 columns = 25 data cells</p>
                </div>
              </Card>

              {/* Section 5: Pricing Information (3 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 5: Pricing Information (3 Fields)</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pricing Summary {isMissing(parsedData?.pricing_summary) && <span className="text-red-600">(Missing)</span>}
                  </label>
                  <textarea
                    value={parsedData?.pricing_summary || ''}
                    onChange={(e) => updateField('pricing_summary', e.target.value)}
                    className={getFieldClass(parsedData?.pricing_summary) + ' h-20'}
                    placeholder="Sales pitch to call/visit - NOT actual prices"
                  />
                </div>
              </Card>

              {/* Section 6: What to Expect (35 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 6: What to Expect (35 Fields - 5 Scenarios)</h3>
                <div className="text-sm text-slate-600">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="mb-4 p-3 bg-white rounded border">
                      <p className="font-semibold mb-2">Scenario {n}</p>
                      <div className="text-xs space-y-1">
                        <p>• Title: {parsedData?.[`scenario_${n}_title`] || '<>'}</p>
                        <p>• Recommended: {parsedData?.[`scenario_${n}_recommended`] || '<>'}</p>
                        <p>• Pro Tip: {parsedData?.[`scenario_${n}_pro_tip`] || '<>'}</p>
                        <p>• What's Involved: 4 steps</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Section 7: Locations (66 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 7: Locations (66 Fields - Up to 6 Locations)</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Location 1 - Address Line 1 {isMissing(parsedData?.location_1_address_1) && <span className="text-red-600">(Required)</span>}
                      </label>
                      <Input
                        value={parsedData?.location_1_address_1 || ''}
                        onChange={(e) => updateField('location_1_address_1', e.target.value)}
                        className={getFieldClass(parsedData?.location_1_address_1)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Location 1 - Address Line 2 {isMissing(parsedData?.location_1_address_2) && <span className="text-red-600">(Required)</span>}
                      </label>
                      <Input
                        value={parsedData?.location_1_address_2 || ''}
                        onChange={(e) => updateField('location_1_address_2', e.target.value)}
                        className={getFieldClass(parsedData?.location_1_address_2)}
                        placeholder="City, State, Zip"
                      />
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <p>Additional locations 2-6: {parsedData?.location_2_address_1 ? 'Present' : 'Not included'}</p>
                    <p className="text-xs mt-1">Each location has 11 fields: 2 address lines + directions URL + 7 hours + service area</p>
                  </div>
                </div>
              </Card>

              {/* Section 8: FAQs (10 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 8: FAQs (10 Fields - 5 Q&A Pairs)</h3>
                <div className="text-sm text-slate-600">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="mb-3 p-3 bg-white rounded border">
                      <p className="font-semibold text-xs mb-1">FAQ {n}</p>
                      <p className="text-xs">Q: {parsedData?.[`faq_${n}_question`] || '<>'}</p>
                      <p className="text-xs">A: {parsedData?.[`faq_${n}_answer`] ? '✓ (50+ words)' : '<>'}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Section 9: Monthly Activity - Skipped (0 fields at intake) */}

              {/* Section 10: Get in Touch + Footer (5 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 10: Get in Touch + Footer (5 Fields)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      City, State {isMissing(parsedData?.city_state) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.city_state || ''}
                      onChange={(e) => updateField('city_state', e.target.value)}
                      className={getFieldClass(parsedData?.city_state)}
                      placeholder="e.g., Long Beach NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Footer Address</label>
                    <Input
                      value={parsedData?.footer_address || ''}
                      onChange={(e) => updateField('footer_address', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Facebook URL</label>
                    <Input
                      value={parsedData?.social_facebook || ''}
                      onChange={(e) => updateField('social_facebook', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Instagram URL</label>
                    <Input
                      value={parsedData?.social_instagram || ''}
                      onChange={(e) => updateField('social_instagram', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">YouTube URL</label>
                    <Input
                      value={parsedData?.social_youtube || ''}
                      onChange={(e) => updateField('social_youtube', e.target.value)}
                    />
                  </div>
                </div>
              </Card>

              {/* Section 11: Photo Gallery (10 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 11: Photo Gallery (10 Fields - 5 Images)</h3>
                <div className="text-sm text-slate-600">
                  <p className="mb-2">Images found: {parsedData?.gallery_image_1 ? '✓' : 'Will be extracted from JSON'}</p>
                  <p className="text-xs">Each image requires: URL + SEO-optimized alt text</p>
                  <p className="text-xs mt-2">Handled automatically during extraction to media_items table.</p>
                </div>
              </Card>

              {/* Section 12: Featured Reviews (25 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 12: Featured Reviews (25 Fields - 5 Reviews)</h3>
                <div className="text-sm text-slate-600">
                  <p className="mb-2">Reviews found: {parsedData?.review_1_reviewer ? '✓' : 'Will be extracted from JSON'}</p>
                  <p className="text-xs">Each review has: Reviewer, Date, Excerpt, Source, URL (5 stars hardcoded)</p>
                  <p className="text-xs mt-2">Handled automatically during extraction to reviews table.</p>
                </div>
              </Card>

              {/* Section 13: SEO/Schema (13 fields) */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-4">Section 13: SEO/Schema (13 Fields - Hidden)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Meta Title (60 chars) {isMissing(parsedData?.seo_meta_title) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.seo_meta_title || ''}
                      onChange={(e) => updateField('seo_meta_title', e.target.value)}
                      className={getFieldClass(parsedData?.seo_meta_title)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Meta Description (160 chars) {isMissing(parsedData?.seo_meta_description) && <span className="text-red-600">(Missing)</span>}
                    </label>
                    <Input
                      value={parsedData?.seo_meta_description || ''}
                      onChange={(e) => updateField('seo_meta_description', e.target.value)}
                      className={getFieldClass(parsedData?.seo_meta_description)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-600">+ H1, 4×H2, OG tags, JSON-LD schema, robots, canonical (11 more fields)</p>
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <div className="bg-slate-100 p-4 rounded-lg">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">All 13 sections reviewed.</span> Total 267 CMS fields will be published to Webflow.
                  Reviews and images are automatically extracted to their tables.
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
                <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
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
