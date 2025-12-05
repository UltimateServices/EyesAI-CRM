'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Company, Intake } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface IntakeFormProps {
  company: Company;
}

export function IntakeForm({ company }: IntakeFormProps) {
  const saveIntake = useStore((state) => state.saveIntake);
  const updateCompanyFromIntake = useStore((state) => state.updateCompanyFromIntake);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);

  const existingIntake = getIntakeByCompanyId(company.id);

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parseError, setParseError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [parsedData, setParsedData] = useState<any>(existingIntake?.romaData || null);

  const isMissing = (value: any): boolean => {
    if (value === null || value === undefined || value === '' || value === '<>') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  };

  const handleImportData = () => {
    try {
      setParseError('');
      const parsed = JSON.parse(pasteText);

      setParsedData(parsed);
      setShowPasteModal(false);
      setPasteText('');
    } catch (error: any) {
      console.error('❌ Import error:', error);
      setParseError('Error: ' + error.message);
    }
  };

  const handleSaveIntake = async () => {
    if (!parsedData) {
      alert('No data to save. Please paste intake first.');
      return;
    }

    setIsSaving(true);

    try {
      // Call the API to save intake data
      const response = await fetch('/api/onboarding/paste-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          romaData: parsedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save intake');
      }

      const result = await response.json();

      // Update local store
      const intakeData: Intake = {
        id: existingIntake?.id || `intake-${company.id}`,
        companyId: company.id,
        status: 'complete',
        romaData: parsedData,
        completedAt: new Date().toISOString(),
        completedBy: 'VA',
        createdAt: existingIntake?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveIntake(intakeData);
      updateCompanyFromIntake(company.id, intakeData);

      alert(`✅ Intake saved successfully!\n\nExtracted:\n• ${result.extracted?.reviews || 0} reviews\n• ${result.extracted?.media || 0} media items\n\nGo to Overview tab to see the data.`);
      setIsSaving(false);
    } catch (error: any) {
      console.error('Save error:', error);
      alert('Failed to save: ' + error.message);
      setIsSaving(false);
    }
  };

  const updateField = (path: string, value: any) => {
    setParsedData((prev: any) => {
      const newData = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const countFields = (data: any): { total: number; missing: number } => {
    if (!data) return { total: 0, missing: 0 };

    let total = 0;
    let missing = 0;

    const countRecursive = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      for (const key of Object.keys(obj)) {
        const value = obj[key];

        if (Array.isArray(value)) {
          total++;
          if (value.length === 0) missing++;
        } else if (typeof value === 'object' && value !== null) {
          countRecursive(value);
        } else {
          total++;
          if (isMissing(value)) missing++;
        }
      }
    };

    countRecursive(data);
    return { total, missing };
  };

  const fieldStats = countFields(parsedData);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ROMA-PDF Intake</h2>
            <p className="text-slate-600">Complete business profile data for {company.name}</p>
            {parsedData && (
              <div className="flex gap-4 mt-2 text-sm">
                <Badge variant="outline" className="font-semibold">
                  {fieldStats.total} total fields
                </Badge>
                {fieldStats.missing > 0 && (
                  <Badge variant="destructive">
                    {fieldStats.missing} missing
                  </Badge>
                )}
                {fieldStats.missing === 0 && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Complete
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowPasteModal(true)}
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-2" />
              Paste Intake
            </Button>
            <Button
              onClick={handleSaveIntake}
              disabled={isSaving || !parsedData}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Intake
                </>
              )}
            </Button>
          </div>
        </div>

        {!parsedData && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              Click "Paste Intake" to import ROMA-PDF JSON data. All 267 CMS fields will be displayed for review.
            </p>
          </div>
        )}
      </Card>

      {showPasteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Paste ROMA-PDF JSON</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPasteModal(false);
                    setPasteText('');
                    setParseError('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paste JSON Data
                  </label>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    className="w-full h-96 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    placeholder='Paste your ROMA-PDF JSON here...'
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {pasteText.length} characters
                  </p>
                </div>

                {parseError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{parseError}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasteModal(false);
                      setPasteText('');
                      setParseError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportData}
                    disabled={!pasteText.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Import Data
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {parsedData && (
        <div className="space-y-6">
          {/* Preview Notice */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>📋 Preview Mode:</strong> Showing all 267 CMS fields. Missing fields are highlighted in red. Edit key fields below and click "Save Intake" when ready.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              💡 Reviews and media images will be automatically extracted and saved to the database.
            </p>
          </Card>

          {/* Section 1: Hero (17 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 1: Hero (17 Fields)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company Name {isMissing(parsedData?.company_name) && <span className="text-red-600">(Missing)</span>}
                </label>
                <Input
                  value={parsedData?.company_name || ''}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  className={isMissing(parsedData?.company_name) ? 'border-red-300 bg-red-50' : ''}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category {isMissing(parsedData?.category) && <span className="text-red-600">(Missing)</span>}
                </label>
                <Input
                  value={parsedData?.category || ''}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={isMissing(parsedData?.category) ? 'border-red-300 bg-red-50' : ''}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  AI Summary (35 words max) {isMissing(parsedData?.ai_summary) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={parsedData?.ai_summary || ''}
                  onChange={(e) => updateField('ai_summary', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${isMissing(parsedData?.ai_summary) ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tagline {isMissing(parsedData?.tagline) && <span className="text-red-600">(Missing)</span>}
                </label>
                <Input
                  value={parsedData?.tagline || ''}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  className={isMissing(parsedData?.tagline) ? 'border-red-300 bg-red-50' : ''}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone {isMissing(parsedData?.phone) && <span className="text-red-600">(Missing)</span>}
                </label>
                <Input
                  value={parsedData?.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={isMissing(parsedData?.phone) ? 'border-red-300 bg-red-50' : ''}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Website URL {isMissing(parsedData?.website_url) && <span className="text-red-600">(Missing)</span>}
                </label>
                <Input
                  value={parsedData?.website_url || ''}
                  onChange={(e) => updateField('website_url', e.target.value)}
                  className={isMissing(parsedData?.website_url) ? 'border-red-300 bg-red-50' : ''}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email {isMissing(parsedData?.email) && <span className="text-red-600">(Missing)</span>}
                </label>
                <Input
                  value={parsedData?.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={isMissing(parsedData?.email) ? 'border-red-300 bg-red-50' : ''}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Company Logo URL {isMissing(parsedData?.company_logo) && <span className="text-red-600">(Missing)</span>}
                </label>
                <Input
                  value={parsedData?.company_logo || ''}
                  onChange={(e) => updateField('company_logo', e.target.value)}
                  className={isMissing(parsedData?.company_logo) ? 'border-red-300 bg-red-50' : ''}
                />
              </div>

              <div className="md:col-span-2">
                <p className="text-xs text-slate-600">+ 8 more fields: ai_signal_1-4, maps_link, etc.</p>
              </div>
            </div>
          </Card>

          {/* Section 2: About (6 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 2: About (6 Fields)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  About Text {isMissing(parsedData?.about_text) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={parsedData?.about_text || ''}
                  onChange={(e) => updateField('about_text', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${isMissing(parsedData?.about_text) ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                  rows={3}
                />
              </div>
              <p className="text-xs text-slate-600">+ 5 more fields: about_title, about_badge_1-4</p>
            </div>
          </Card>

          {/* Section 3: Services (47 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 3: Services (47 Fields)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Services Section Title
                </label>
                <Input value={parsedData?.services_section_title || ''} readOnly className="bg-white" />
              </div>
              <p className="text-xs text-slate-600">
                6 services × 7 fields each = 42 fields + 5 overview fields
              </p>
              <p className="text-xs text-slate-600">
                Fields per service: emoji, title, price, description, duration, included_1-4
              </p>
            </div>
          </Card>

          {/* Section 4: Quick Reference Guide (30 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 4: Quick Reference Guide (30 Fields)</h3>
            <p className="text-xs text-slate-600">
              5×5 table: qrg_column_1-5 + qrg_row_[R]_col_[C] (25 cells)
            </p>
          </Card>

          {/* Section 5: Pricing Information (3 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 5: Pricing Information (3 Fields)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Pricing Summary
                </label>
                <Input value={parsedData?.pricing_summary || ''} readOnly className="bg-white" />
              </div>
              <p className="text-xs text-slate-600">+ pricing_cta_1, pricing_cta_2</p>
            </div>
          </Card>

          {/* Section 6: What to Expect (35 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 6: What to Expect (35 Fields)</h3>
            <p className="text-xs text-slate-600">
              6 scenarios × 5 fields each + 5 overview fields
            </p>
            <p className="text-xs text-slate-600">
              Fields per scenario: title, recommended, pro_tip, involved_1-4
            </p>
          </Card>

          {/* Section 7: Locations (66 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 7: Locations (66 Fields)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Location 1 - Address Line 1
                </label>
                <Input value={parsedData?.location_1_address_1 || ''} readOnly className="bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Location 1 - Address Line 2
                </label>
                <Input value={parsedData?.location_1_address_2 || ''} readOnly className="bg-white" />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              3 locations × 22 fields each (address, hours, directions, service area, etc.)
            </p>
          </Card>

          {/* Section 8: FAQs (10 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 8: FAQs (10 Fields)</h3>
            <p className="text-xs text-slate-600">
              5 FAQs × 2 fields each: faq_[N]_question, faq_[N]_answer
            </p>
          </Card>

          {/* Section 10: Get in Touch + Footer (5 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 10: Get in Touch + Footer (5 Fields)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  City, State
                </label>
                <Input value={parsedData?.city_state || ''} readOnly className="bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Footer Address
                </label>
                <Input value={parsedData?.footer_address || ''} readOnly className="bg-white" />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              + social_facebook, social_instagram, social_youtube
            </p>
          </Card>

          {/* Section 11: Photo Gallery (10 fields) */}
          <Card className="p-4 bg-slate-50 border-blue-200 bg-blue-50">
            <h3 className="font-semibold text-lg mb-4">Section 11: Photo Gallery (10 Fields)</h3>
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <CheckCircle2 className="w-4 h-4" />
              <p>
                Images will be <strong>auto-extracted</strong> from JSON and saved to Media tab
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Fields: gallery_image_1-5 (URLs), gallery_image_1-5_alt (descriptions)
            </p>
          </Card>

          {/* Section 12: Featured Reviews (25 fields) */}
          <Card className="p-4 bg-slate-50 border-blue-200 bg-blue-50">
            <h3 className="font-semibold text-lg mb-4">Section 12: Featured Reviews (25 Fields)</h3>
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <CheckCircle2 className="w-4 h-4" />
              <p>
                Reviews will be <strong>auto-extracted</strong> from JSON and saved to Reviews tab
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              5 reviews × 5 fields each: reviewer, date, excerpt, source, url
            </p>
          </Card>

          {/* Section 13: SEO/Schema (13 fields) */}
          <Card className="p-4 bg-slate-50">
            <h3 className="font-semibold text-lg mb-4">Section 13: SEO/Schema (13 Fields)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  SEO Meta Title
                </label>
                <Input value={parsedData?.seo_meta_title || ''} readOnly className="bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  SEO Meta Description
                </label>
                <Input value={parsedData?.seo_meta_description || ''} readOnly className="bg-white" />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-3">
              + seo_h1, seo_h2_1-4, seo_og_title, seo_og_description, seo_og_image, seo_jsonld, seo_robots, seo_canonical
            </p>
          </Card>

          {/* Summary Card */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-900">Ready to Save</h3>
                <p className="text-sm text-green-800 mt-1">
                  All 267 CMS fields are loaded. Click <strong>"Save Intake"</strong> above to:
                </p>
                <ul className="text-sm text-green-800 mt-2 ml-4 space-y-1">
                  <li>• Save JSON data to database</li>
                  <li>• Extract reviews to Reviews tab</li>
                  <li>• Extract images to Media tab</li>
                  <li>• Update company information</li>
                  <li>• Display on Overview tab</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
