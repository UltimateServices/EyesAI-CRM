'use client';

import { useState, useEffect } from 'react';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CompanyOverviewProps {
  company: Company;
}

export function CompanyOverview({ company }: CompanyOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [romaData, setRomaData] = useState<any>(null);
  const [schemaExpanded, setSchemaExpanded] = useState(false);

  useEffect(() => {
    fetchIntakeData();
  }, [company.id]);

  const fetchIntakeData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/intakes?companyId=${company.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch intake data');
      }
      const data = await response.json();

      if (data.intake?.roma_data) {
        const parsed = typeof data.intake.roma_data === 'string'
          ? JSON.parse(data.intake.roma_data)
          : data.intake.roma_data;
        console.log('🔍 Loaded ROMA data:', parsed);
        setRomaData(parsed);
      } else {
        setError('No intake data available yet');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/intakes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          romaData: romaData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      setSuccess('✅ Changes saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncToWebflow = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/webflow/publish-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to sync to Webflow');
      }

      setSuccess('✅ Successfully synced to Webflow!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to sync to Webflow');
    } finally {
      setSyncing(false);
    }
  };

  const updateField = (path: string, value: any) => {
    setRomaData((prev: any) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!romaData) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">No intake data available yet.</p>
          <p className="text-sm text-slate-500">Complete Step 2 in onboarding to import intake data.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save & Sync Buttons */}
      <div className="flex items-center justify-between sticky top-0 bg-white z-10 py-4 border-b">
        <h2 className="text-2xl font-bold text-slate-900">Company Overview</h2>
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="default"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={handleSyncToWebflow}
            disabled={syncing}
            variant="outline"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync to Webflow
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">{success}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Step 1: Basic Company Info (from Stripe) */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">📋 Step 1: Basic Info (from Stripe Checkout)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Company Name (from Step 1)</label>
            <Input value={company.name || ''} disabled className="bg-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email (from Step 1)</label>
            <Input value={company.email || ''} disabled className="bg-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone (from Step 1)</label>
            <Input value={company.phone || ''} disabled className="bg-slate-100" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Website (from Step 1)</label>
            <Input value={company.website || ''} disabled className="bg-slate-100" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Address (from Step 1)</label>
            <Input value={company.address || ''} disabled className="bg-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City (from Step 1)</label>
            <Input value={company.city || ''} disabled className="bg-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">State (from Step 1)</label>
            <Input value={company.state || ''} disabled className="bg-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">ZIP (from Step 1)</label>
            <Input value={company.zip || ''} disabled className="bg-slate-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Plan (from Step 1)</label>
            <Input value={company.plan || ''} disabled className="bg-slate-100" />
          </div>
        </div>
      </Card>

      {/* Hero Section (Step 2) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Hero Section (Step 2 - ROMA JSON)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Company Name (CMS Field)</label>
            <Input value={romaData.hero?.company_name || ''} onChange={(e) => updateField('hero.company_name', e.target.value)} placeholder={company.name} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
            <Input value={romaData.hero?.tagline || ''} onChange={(e) => updateField('hero.tagline', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <Input value={romaData.hero?.phone || ''} onChange={(e) => updateField('hero.phone', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <Input value={romaData.hero?.email || ''} onChange={(e) => updateField('hero.email', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Summary</label>
            <Textarea value={romaData.hero?.ai_summary || ''} onChange={(e) => updateField('hero.ai_summary', e.target.value)} rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Signal 1 (Feature Tag)</label>
            <Input value={romaData.hero?.ai_signal_1 || ''} onChange={(e) => updateField('hero.ai_signal_1', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Signal 2 (Feature Tag)</label>
            <Input value={romaData.hero?.ai_signal_2 || ''} onChange={(e) => updateField('hero.ai_signal_2', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Signal 3 (Feature Tag)</label>
            <Input value={romaData.hero?.ai_signal_3 || ''} onChange={(e) => updateField('hero.ai_signal_3', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Signal 4 (Feature Tag)</label>
            <Input value={romaData.hero?.ai_signal_4 || ''} onChange={(e) => updateField('hero.ai_signal_4', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* About Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">About Section</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">About Title</label>
            <Input value={romaData.about?.about_title || ''} onChange={(e) => updateField('about.about_title', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">About Text</label>
            <Textarea value={romaData.about?.about_text || ''} onChange={(e) => updateField('about.about_text', e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Badge 1</label>
              <Input value={romaData.about?.about_badge_1 || ''} onChange={(e) => updateField('about.about_badge_1', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Badge 2</label>
              <Input value={romaData.about?.about_badge_2 || ''} onChange={(e) => updateField('about.about_badge_2', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Badge 3</label>
              <Input value={romaData.about?.about_badge_3 || ''} onChange={(e) => updateField('about.about_badge_3', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Badge 4</label>
              <Input value={romaData.about?.about_badge_4 || ''} onChange={(e) => updateField('about.about_badge_4', e.target.value)} />
            </div>
          </div>
        </div>
      </Card>

      {/* Services */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Services / Menu Items</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((num) => {
            const service = romaData.services?.[`service_${num}`];
            if (!service) return null;

            return (
              <Card key={num} className="p-4 border-2">
                <h4 className="font-medium text-slate-900 mb-3">Service {num}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                    <Input value={service.title || ''} onChange={(e) => updateField(`services.service_${num}.title`, e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Emoji</label>
                    <Input value={service.emoji || ''} onChange={(e) => updateField(`services.service_${num}.emoji`, e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                    <Textarea value={service.description || ''} onChange={(e) => updateField(`services.service_${num}.description`, e.target.value)} rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Price</label>
                    <Input value={service.price || ''} onChange={(e) => updateField(`services.service_${num}.price`, e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
                    <Input value={service.duration || ''} onChange={(e) => updateField(`services.service_${num}.duration`, e.target.value)} />
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => service[`included_${i}`] && (
                    <div key={i} className="col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Included {i}</label>
                      <Input value={service[`included_${i}`] || ''} onChange={(e) => updateField(`services.service_${num}.included_${i}`, e.target.value)} />
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Quick Reference Guide */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Reference Guide / Table</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num}>
                <label className="block text-xs font-medium text-slate-600 mb-1">Column {num}</label>
                <Input value={romaData.quick_reference_guide?.[`column_${num}`] || ''} onChange={(e) => updateField(`quick_reference_guide.column_${num}`, e.target.value)} />
              </div>
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((rowNum) => {
            const row = romaData.quick_reference_guide?.[`row_${rowNum}`];
            if (!row) return null;

            return (
              <div key={rowNum} className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((colNum) => (
                  <Input key={colNum} value={row[`col_${colNum}`] || ''} onChange={(e) => updateField(`quick_reference_guide.row_${rowNum}.col_${colNum}`, e.target.value)} placeholder={`Row ${rowNum} Col ${colNum}`} />
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      {/* FAQs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">FAQs</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((num) => {
            const faq = romaData.faqs?.[`faq_${num}`];
            if (!faq) return null;

            return (
              <Card key={num} className="p-3 border">
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Question {num}</label>
                    <Input value={faq.question || ''} onChange={(e) => updateField(`faqs.faq_${num}.question`, e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Answer {num}</label>
                    <Textarea value={faq.answer || ''} onChange={(e) => updateField(`faqs.faq_${num}.answer`, e.target.value)} rows={2} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Pricing Information */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">💰 Pricing Information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pricing Summary</label>
            <Textarea value={romaData.pricing_information?.pricing_summary || ''} onChange={(e) => updateField('pricing_information.pricing_summary', e.target.value)} rows={3} />
          </div>
        </div>
      </Card>

      {/* Contact & Location */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact & Location</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Footer Address</label>
            <Input value={romaData.get_in_touch?.footer_address || ''} onChange={(e) => updateField('get_in_touch.footer_address', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">City, State</label>
            <Input value={romaData.get_in_touch?.city_state || ''} onChange={(e) => updateField('get_in_touch.city_state', e.target.value)} placeholder="e.g., Miami, FL" />
          </div>
        </div>
      </Card>

      {/* SEO Metadata */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">SEO Metadata & Schema</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SEO Meta Title</label>
            <Input value={romaData.seo_schema?.seo_meta_title || ''} onChange={(e) => updateField('seo_schema.seo_meta_title', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SEO H1</label>
            <Input value={romaData.seo_schema?.seo_h1 || ''} onChange={(e) => updateField('seo_schema.seo_h1', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SEO Meta Description</label>
            <Textarea value={romaData.seo_schema?.seo_meta_description || ''} onChange={(e) => updateField('seo_schema.seo_meta_description', e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SEO H2 #1</label>
              <Input value={romaData.seo_schema?.seo_h2_1 || ''} onChange={(e) => updateField('seo_schema.seo_h2_1', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SEO H2 #2</label>
              <Input value={romaData.seo_schema?.seo_h2_2 || ''} onChange={(e) => updateField('seo_schema.seo_h2_2', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SEO H2 #3</label>
              <Input value={romaData.seo_schema?.seo_h2_3 || ''} onChange={(e) => updateField('seo_schema.seo_h2_3', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SEO H2 #4</label>
              <Input value={romaData.seo_schema?.seo_h2_4 || ''} onChange={(e) => updateField('seo_schema.seo_h2_4', e.target.value)} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Schema.org JSON-LD (Structured Data)</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSchemaExpanded(!schemaExpanded);
                }}
                className="h-6 px-2 text-xs"
              >
                {schemaExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            </div>
            <Textarea
              key={`schema-${schemaExpanded}`}
              value={typeof romaData.seo_schema?.seo_jsonld === 'object' ? JSON.stringify(romaData.seo_schema?.seo_jsonld, null, 2) : (romaData.seo_schema?.seo_jsonld || '')}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateField('seo_schema.seo_jsonld', parsed);
                } catch {
                  updateField('seo_schema.seo_jsonld', e.target.value);
                }
              }}
              rows={schemaExpanded ? 15 : 3}
              className="font-mono text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Canonical URL</label>
              <Input value={romaData.seo_schema?.seo_canonical || ''} onChange={(e) => updateField('seo_schema.seo_canonical', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Robots</label>
              <Input value={romaData.seo_schema?.seo_robots || ''} onChange={(e) => updateField('seo_schema.seo_robots', e.target.value)} placeholder="index, follow" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">OpenGraph Title</label>
            <Input value={romaData.seo_schema?.seo_og_title || ''} onChange={(e) => updateField('seo_schema.seo_og_title', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">OpenGraph Description</label>
            <Textarea value={romaData.seo_schema?.seo_og_description || ''} onChange={(e) => updateField('seo_schema.seo_og_description', e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">OpenGraph Image URL</label>
            <Input value={romaData.seo_schema?.seo_og_image || ''} onChange={(e) => updateField('seo_schema.seo_og_image', e.target.value)} />
          </div>
        </div>
      </Card>
    </div>
  );
}
