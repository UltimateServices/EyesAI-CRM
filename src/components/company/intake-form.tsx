'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Company, Intake } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  FileText,
  X,
  Loader2,
  Plus,
  Trash2
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
  
  const [formData, setFormData] = useState<any>(existingIntake?.romaData || null);

  // Check if field is missing
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

  const handleImportData = () => {
    try {
      setParseError('');
      const parsed = JSON.parse(pasteText);
      
      if (!parsed.template || !parsed.profile_layout_version) {
        throw new Error('Invalid ROMA-PDF format. Missing template or version.');
      }

      // Transform the data to handle ALL variations
      const transformed = {
        ...parsed,
        
        // FIX 1: Normalize hero section
        hero: parsed.hero ? {
          business_name: parsed.hero.business_name || parsed.hero.company_name || '',
          tagline: parsed.hero.tagline || '',
          hero_image_url: parsed.hero.hero_image_url || '<>',
          badges: parsed.hero.badges || [],
          
          // FIX 2: Normalize quick_actions
          quick_actions: (() => {
            const qa = parsed.hero.quick_actions;
            if (qa && !Array.isArray(qa) && typeof qa === 'object') return qa;
            if (Array.isArray(qa)) {
              const result: any = {};
              qa.forEach((action: any) => {
                if (action.action_type === 'call_tel') result.call_tel = action.value;
                if (action.action_type === 'website_url') result.website_url = action.value;
                if (action.action_type === 'email_mailto') result.email_mailto = action.value;
                if (action.action_type === 'maps_link') result.maps_link = action.value;
              });
              return result;
            }
            return {};
          })()
        } : undefined,
        
        // FIX 3: pricing_information
        pricing_information: parsed.pricing_information ? {
          ...parsed.pricing_information,
          cta_buttons: parsed.pricing_information.cta_buttons?.map((btn: any) => 
            typeof btn === 'string' ? btn : (btn.label || btn)
          ) || []
        } : undefined,
        
        // FIX 4: get_in_touch buttons
        get_in_touch: parsed.get_in_touch ? {
          ...parsed.get_in_touch,
          buttons: (() => {
            const btns = parsed.get_in_touch.buttons;
            if (!btns) return [];
            if (Array.isArray(btns)) {
              return btns.map((btn: any) => typeof btn === 'string' ? btn : (btn.label || btn));
            }
            return [];
          })()
        } : undefined,
        
        // FIX 5: quick_reference_guide
        quick_reference_guide: (() => {
          const qrg = parsed.quick_reference_guide;
          if (!qrg) return undefined;
          if (qrg.table_5x5) {
            return { columns: qrg.table_5x5.headers || [], rows: qrg.table_5x5.rows || [] };
          }
          if (qrg.columns || qrg.rows) {
            return { columns: qrg.columns || [], rows: qrg.rows || [] };
          }
          return undefined;
        })(),
        
        // FIX 6: locations_and_hours
        locations_and_hours: (() => {
          const lh = parsed.locations_and_hours;
          if (!lh) return undefined;
          const pl = lh.primary_location || {};
          let address_line1 = pl.address_line1 || '';
          let city_state_zip = pl.city_state_zip || '';
          if (pl.full_address && !address_line1) {
            const parts = pl.full_address.split(',');
            address_line1 = parts[0]?.trim() || '';
            city_state_zip = parts.slice(1).join(',').trim() || '';
          }
          return {
            primary_location: { address_line1, city_state_zip, google_maps_embed_url: pl.coordinates || pl.google_maps_embed_url || '<>' },
            opening_hours: lh.opening_hours || {},
            hours_note: lh.hours_note || '',
            service_area_text: lh.service_area_text || ''
          };
        })(),
        
        // FIX 7: FAQs
        faqs: (() => {
          const faqs = parsed.faqs;
          if (!faqs) return undefined;
          return {
            all_questions: faqs.all_questions ? 
              Object.fromEntries(
                Object.entries(faqs.all_questions).map(([category, questions]: [string, any]) => [
                  category,
                  (questions || []).map((faq: any) => ({
                    question: faq.q || faq.question || '',
                    answer: faq.a || faq.answer || ''
                  }))
                ])
              ) : undefined,
            whats_new: faqs.whats_new ? {
              month_label: faqs.whats_new.month_label || '',
              questions: (faqs.whats_new.updates || faqs.whats_new.monthly_updates || faqs.whats_new.questions || []).map((item: any) => ({
                question: item.q || item.question || '',
                answer: item.a || item.answer || ''
              }))
            } : undefined
          };
        })()
      };

      console.log('Transformed data:', transformed);
      setFormData(transformed);
      setShowPasteModal(false);
      setPasteText('');
    } catch (error: any) {
      console.error('Import error:', error);
      setParseError('Error: ' + error.message);
    }
  };

  const handleSaveIntake = async () => {
    if (!formData) {
      alert('No data to save. Please paste intake first.');
      return;
    }

    setIsSaving(true);

    try {
      const intakeData: Intake = {
        id: existingIntake?.id || `intake-${company.id}`,
        companyId: company.id,
        status: 'complete',
        romaData: formData,
        completedAt: new Date().toISOString(),
        completedBy: 'VA',
        createdAt: existingIntake?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveIntake(intakeData);
      updateCompanyFromIntake(company.id, intakeData);
      
      alert('✅ Intake saved successfully! Go to Overview tab to see the data.');
      setIsSaving(false);
    } catch (error: any) {
      console.error('Save error:', error);
      alert('Failed to save: ' + error.message);
      setIsSaving(false);
    }
  };

  const updateField = (path: string, value: any) => {
    setFormData((prev: any) => {
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

  const addService = () => {
    const newService = {
      emoji: '📦',
      title: '',
      summary_1line: '',
      whats_included: [''],
      duration: '',
      pricing_label: '',
      learn_more_url: ''
    };
    
    const services = formData.services || [];
    updateField('services', [...services, newService]);
  };

  const removeService = (index: number) => {
    const services = [...formData.services];
    services.splice(index, 1);
    updateField('services', services);
  };

  const updateService = (index: number, field: string, value: any) => {
    const services = [...formData.services];
    services[index][field] = value;
    updateField('services', services);
  };

  const addWhatToExpect = () => {
    const newCard = {
      emoji: '📋',
      title: '',
      recommended_for: '',
      whats_involved: [''],
      pro_tip: ''
    };
    
    const cards = formData.what_to_expect || [];
    updateField('what_to_expect', [...cards, newCard]);
  };

  const removeWhatToExpect = (index: number) => {
    const cards = [...formData.what_to_expect];
    cards.splice(index, 1);
    updateField('what_to_expect', cards);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ROMA-PDF Intake</h2>
            <p className="text-slate-600">Complete business profile data for {company.name}</p>
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
              disabled={isSaving || !formData}
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

        {!formData && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">
              Click "Paste Intake" to import ROMA-PDF data. Fields highlighted in red are missing data.
            </p>
          </div>
        )}
      </Card>

      {/* Paste Modal */}
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

      {/* ALL FORM FIELDS */}
      {formData && (
        <div className="space-y-6">
          {/* 1. Category & AI Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">1. Category & AI Overview</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category {isMissing(formData.category) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={getFieldClass(formData.category)}
                  placeholder="e.g., Beauty & Personal Care"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AI Overview Line {isMissing(formData.ai_overview?.overview_line) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={formData.ai_overview?.overview_line || ''}
                  onChange={(e) => updateField('ai_overview.overview_line', e.target.value)}
                  className={getFieldClass(formData.ai_overview?.overview_line)}
                  rows={2}
                  placeholder="One sentence summary (40-140 characters)"
                />
              </div>
            </div>
          </Card>

          {/* 2. Hero Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">2. Hero Section</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Name {isMissing(formData.hero?.business_name) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.hero?.business_name || ''}
                  onChange={(e) => updateField('hero.business_name', e.target.value)}
                  className={getFieldClass(formData.hero?.business_name)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tagline {isMissing(formData.hero?.tagline) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.hero?.tagline || ''}
                  onChange={(e) => updateField('hero.tagline', e.target.value)}
                  className={getFieldClass(formData.hero?.tagline)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hero Image URL {isMissing(formData.hero?.hero_image_url) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.hero?.hero_image_url || ''}
                  onChange={(e) => updateField('hero.hero_image_url', e.target.value)}
                  className={getFieldClass(formData.hero?.hero_image_url)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Badges (comma-separated) {isMissing(formData.hero?.badges) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.hero?.badges?.join(', ') || ''}
                  onChange={(e) => updateField('hero.badges', e.target.value.split(',').map((b: string) => b.trim()))}
                  className={getFieldClass(formData.hero?.badges)}
                  placeholder="Verified Oct 2025, Google Indexed, AI-Discoverable"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone (tel:) {isMissing(formData.hero?.quick_actions?.call_tel) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.hero?.quick_actions?.call_tel || ''}
                  onChange={(e) => updateField('hero.quick_actions.call_tel', e.target.value)}
                  className={getFieldClass(formData.hero?.quick_actions?.call_tel)}
                  placeholder="tel:+15551234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website URL {isMissing(formData.hero?.quick_actions?.website_url) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.hero?.quick_actions?.website_url || ''}
                  onChange={(e) => updateField('hero.quick_actions.website_url', e.target.value)}
                  className={getFieldClass(formData.hero?.quick_actions?.website_url)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email (mailto:) {isMissing(formData.hero?.quick_actions?.email_mailto) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.hero?.quick_actions?.email_mailto || ''}
                  onChange={(e) => updateField('hero.quick_actions.email_mailto', e.target.value)}
                  className={getFieldClass(formData.hero?.quick_actions?.email_mailto)}
                  placeholder="mailto:info@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Maps Link {isMissing(formData.hero?.quick_actions?.maps_link) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.hero?.quick_actions?.maps_link || ''}
                  onChange={(e) => updateField('hero.quick_actions.maps_link', e.target.value)}
                  className={getFieldClass(formData.hero?.quick_actions?.maps_link)}
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
            </div>
          </Card>

          {/* 3. About & Badges */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">3. About & Badges</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  About Summary (120 words) {isMissing(formData.about_and_badges?.ai_summary_120w) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={formData.about_and_badges?.ai_summary_120w || ''}
                  onChange={(e) => updateField('about_and_badges.ai_summary_120w', e.target.value)}
                  className={getFieldClass(formData.about_and_badges?.ai_summary_120w)}
                  rows={5}
                  placeholder="Comprehensive business overview..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Badges (comma-separated) {isMissing(formData.about_and_badges?.company_badges) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.about_and_badges?.company_badges?.join(', ') || ''}
                  onChange={(e) => updateField('about_and_badges.company_badges', e.target.value.split(',').map((b: string) => b.trim()))}
                  className={getFieldClass(formData.about_and_badges?.company_badges)}
                  placeholder="Expert Stylists, Full Service, Open Sundays, Walk-Ins Welcome"
                />
              </div>
            </div>
          </Card>

          {/* 4. Services */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">4. Services (4-6 services)</h3>
              <Button 
                onClick={addService}
                size="sm"
                variant="outline"
                disabled={formData.services?.length >= 6}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </div>

            <div className="space-y-6">
              {formData.services?.map((service: any, index: number) => (
                <div key={index} className="p-4 border-2 border-slate-200 rounded-lg relative">
                  <Button
                    onClick={() => removeService(index)}
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <h4 className="font-semibold mb-3">Service {index + 1}</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Emoji</label>
                      <input
                        type="text"
                        value={service.emoji || ''}
                        onChange={(e) => updateService(index, 'emoji', e.target.value)}
                        className={getFieldClass(service.emoji)}
                        placeholder="✂️"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={service.title || ''}
                        onChange={(e) => updateService(index, 'title', e.target.value)}
                        className={getFieldClass(service.title)}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Summary (1 line)</label>
                      <input
                        type="text"
                        value={service.summary_1line || ''}
                        onChange={(e) => updateService(index, 'summary_1line', e.target.value)}
                        className={getFieldClass(service.summary_1line)}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">What's Included (comma-separated)</label>
                      <textarea
                        value={service.whats_included?.join(', ') || ''}
                        onChange={(e) => updateService(index, 'whats_included', e.target.value.split(',').map((i: string) => i.trim()))}
                        className={getFieldClass(service.whats_included)}
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={service.duration || ''}
                        onChange={(e) => updateService(index, 'duration', e.target.value)}
                        className={getFieldClass(service.duration)}
                        placeholder="45-60 minutes"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Pricing Label</label>
                      <input
                        type="text"
                        value={service.pricing_label || ''}
                        onChange={(e) => updateService(index, 'pricing_label', e.target.value)}
                        className={getFieldClass(service.pricing_label)}
                        placeholder="Starting at $50"
                      />
                    </div>
                  </div>
                </div>
              )) || (
                <div className="p-8 bg-red-50 border-2 border-red-300 rounded-lg text-center">
                  <p className="text-red-800 font-medium">No services. Click "Add Service" to create one.</p>
                </div>
              )}
            </div>
          </Card>

          {/* 5. Quick Reference Guide */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">5. Quick Reference Guide (5x5 Table)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Column Headers (comma-separated) {isMissing(formData.quick_reference_guide?.columns) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.quick_reference_guide?.columns?.join(', ') || ''}
                  onChange={(e) => updateField('quick_reference_guide.columns', e.target.value.split(',').map((c: string) => c.trim()))}
                  className={getFieldClass(formData.quick_reference_guide?.columns)}
                  placeholder="Service Type, Duration, Complexity, Best For, Price Range"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rows (JSON format - array of arrays) {isMissing(formData.quick_reference_guide?.rows) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={JSON.stringify(formData.quick_reference_guide?.rows, null, 2) || ''}
                  onChange={(e) => {
                    try {
                      updateField('quick_reference_guide.rows', JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className={`${getFieldClass(formData.quick_reference_guide?.rows)} font-mono`}
                  rows={8}
                  placeholder='[["Row 1 Col 1", "Row 1 Col 2"], ["Row 2 Col 1", "Row 2 Col 2"]]'
                />
              </div>
            </div>
          </Card>

          {/* 6. Pricing Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">6. Pricing Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Summary Line {isMissing(formData.pricing_information?.summary_line) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={formData.pricing_information?.summary_line || ''}
                  onChange={(e) => updateField('pricing_information.summary_line', e.target.value)}
                  className={getFieldClass(formData.pricing_information?.summary_line)}
                  rows={2}
                  placeholder="One sentence pricing overview..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CTA Buttons (comma-separated) {isMissing(formData.pricing_information?.cta_buttons) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.pricing_information?.cta_buttons?.join(', ') || ''}
                  onChange={(e) => updateField('pricing_information.cta_buttons', e.target.value.split(',').map((b: string) => b.trim()))}
                  className={getFieldClass(formData.pricing_information?.cta_buttons)}
                  placeholder="Go to Company Website, Call Company"
                />
              </div>
            </div>
          </Card>

          {/* 7. What to Expect */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">7. What to Expect (6 cards)</h3>
              <Button 
                onClick={addWhatToExpect}
                size="sm"
                variant="outline"
                disabled={formData.what_to_expect?.length >= 6}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </div>

            <div className="space-y-4">
              {formData.what_to_expect?.map((card: any, index: number) => (
                <div key={index} className="p-4 border-2 border-slate-200 rounded-lg relative">
                  <Button
                    onClick={() => removeWhatToExpect(index)}
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <h4 className="font-semibold mb-3">Card {index + 1}</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Emoji</label>
                      <input
                        type="text"
                        value={card.emoji || ''}
                        onChange={(e) => {
                          const cards = [...formData.what_to_expect];
                          cards[index].emoji = e.target.value;
                          updateField('what_to_expect', cards);
                        }}
                        className={getFieldClass(card.emoji)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={card.title || ''}
                        onChange={(e) => {
                          const cards = [...formData.what_to_expect];
                          cards[index].title = e.target.value;
                          updateField('what_to_expect', cards);
                        }}
                        className={getFieldClass(card.title)}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Recommended For</label>
                      <input
                        type="text"
                        value={card.recommended_for || ''}
                        onChange={(e) => {
                          const cards = [...formData.what_to_expect];
                          cards[index].recommended_for = e.target.value;
                          updateField('what_to_expect', cards);
                        }}
                        className={getFieldClass(card.recommended_for)}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">What's Involved (comma-separated)</label>
                      <textarea
                        value={card.whats_involved?.join(', ') || ''}
                        onChange={(e) => {
                          const cards = [...formData.what_to_expect];
                          cards[index].whats_involved = e.target.value.split(',').map((i: string) => i.trim());
                          updateField('what_to_expect', cards);
                        }}
                        className={getFieldClass(card.whats_involved)}
                        rows={2}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Pro Tip</label>
                      <textarea
                        value={card.pro_tip || ''}
                        onChange={(e) => {
                          const cards = [...formData.what_to_expect];
                          cards[index].pro_tip = e.target.value;
                          updateField('what_to_expect', cards);
                        }}
                        className={getFieldClass(card.pro_tip)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )) || (
                <div className="p-8 bg-red-50 border-2 border-red-300 rounded-lg text-center">
                  <p className="text-red-800 font-medium">No cards. Click "Add Card" to create one.</p>
                </div>
              )}
            </div>
          </Card>

          {/* 8. Location & Hours */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">8. Location & Hours</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address Line 1 {isMissing(formData.locations_and_hours?.primary_location?.address_line1) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.locations_and_hours?.primary_location?.address_line1 || ''}
                  onChange={(e) => updateField('locations_and_hours.primary_location.address_line1', e.target.value)}
                  className={getFieldClass(formData.locations_and_hours?.primary_location?.address_line1)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City, State, ZIP {isMissing(formData.locations_and_hours?.primary_location?.city_state_zip) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.locations_and_hours?.primary_location?.city_state_zip || ''}
                  onChange={(e) => updateField('locations_and_hours.primary_location.city_state_zip', e.target.value)}
                  className={getFieldClass(formData.locations_and_hours?.primary_location?.city_state_zip)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Google Maps Embed URL {isMissing(formData.locations_and_hours?.primary_location?.google_maps_embed_url) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.locations_and_hours?.primary_location?.google_maps_embed_url || ''}
                  onChange={(e) => updateField('locations_and_hours.primary_location.google_maps_embed_url', e.target.value)}
                  className={getFieldClass(formData.locations_and_hours?.primary_location?.google_maps_embed_url)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opening Hours (JSON object) {isMissing(formData.locations_and_hours?.opening_hours) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={JSON.stringify(formData.locations_and_hours?.opening_hours, null, 2) || ''}
                  onChange={(e) => {
                    try {
                      updateField('locations_and_hours.opening_hours', JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className={`${getFieldClass(formData.locations_and_hours?.opening_hours)} font-mono`}
                  rows={8}
                  placeholder='{"monday": "Closed", "tuesday": "9:00 AM - 6:00 PM"}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hours Note {isMissing(formData.locations_and_hours?.hours_note) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.locations_and_hours?.hours_note || ''}
                  onChange={(e) => updateField('locations_and_hours.hours_note', e.target.value)}
                  className={getFieldClass(formData.locations_and_hours?.hours_note)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service Area Text {isMissing(formData.locations_and_hours?.service_area_text) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={formData.locations_and_hours?.service_area_text || ''}
                  onChange={(e) => updateField('locations_and_hours.service_area_text', e.target.value)}
                  className={getFieldClass(formData.locations_and_hours?.service_area_text)}
                  rows={2}
                />
              </div>
            </div>
          </Card>

          {/* 9. FAQs */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">9. FAQs</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  All Questions (JSON object) {isMissing(formData.faqs?.all_questions) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={JSON.stringify(formData.faqs?.all_questions, null, 2) || ''}
                  onChange={(e) => {
                    try {
                      updateField('faqs.all_questions', JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className={`${getFieldClass(formData.faqs?.all_questions)} font-mono`}
                  rows={12}
                  placeholder='{"category_name": [{"question": "...", "answer": "..."}]}'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  What's New (JSON object) {isMissing(formData.faqs?.whats_new) && <span className="text-red-600">(Missing)</span>}
                </label>
                <textarea
                  value={JSON.stringify(formData.faqs?.whats_new, null, 2) || ''}
                  onChange={(e) => {
                    try {
                      updateField('faqs.whats_new', JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className={`${getFieldClass(formData.faqs?.whats_new)} font-mono`}
                  rows={6}
                  placeholder='{"month_label": "October 2025", "questions": [...]}'
                />
              </div>
            </div>
          </Card>

          {/* 10. Reviews */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">10. Featured Reviews (3 reviews)</h3>
            <div className="space-y-4">
              {[0, 1, 2].map((index) => {
                const review = formData.featured_reviews?.items?.[index] || {};
                return (
                  <div key={index} className="p-4 border-2 border-slate-200 rounded-lg">
                    <h4 className="font-semibold mb-3">Review {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Reviewer Name</label>
                        <input
                          type="text"
                          value={review.reviewer || ''}
                          onChange={(e) => {
                            const items = formData.featured_reviews?.items || [{}, {}, {}];
                            items[index] = { ...items[index], reviewer: e.target.value };
                            updateField('featured_reviews.items', items);
                          }}
                          className={getFieldClass(review.reviewer)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Stars</label>
                        <input
                          type="number"
                          value={review.stars || 5}
                          onChange={(e) => {
                            const items = formData.featured_reviews?.items || [{}, {}, {}];
                            items[index] = { ...items[index], stars: parseInt(e.target.value) };
                            updateField('featured_reviews.items', items);
                          }}
                          className={getFieldClass(review.stars)}
                          min="1"
                          max="5"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                        <input
                          type="text"
                          value={review.date || ''}
                          onChange={(e) => {
                            const items = formData.featured_reviews?.items || [{}, {}, {}];
                            items[index] = { ...items[index], date: e.target.value };
                            updateField('featured_reviews.items', items);
                          }}
                          className={getFieldClass(review.date)}
                          placeholder="October 2025"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Source</label>
                        <input
                          type="text"
                          value={review.source || ''}
                          onChange={(e) => {
                            const items = formData.featured_reviews?.items || [{}, {}, {}];
                            items[index] = { ...items[index], source: e.target.value };
                            updateField('featured_reviews.items', items);
                          }}
                          className={getFieldClass(review.source)}
                          placeholder="Google/Yelp/Facebook"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Review Excerpt</label>
                        <textarea
                          value={review.excerpt || ''}
                          onChange={(e) => {
                            const items = formData.featured_reviews?.items || [{}, {}, {}];
                            items[index] = { ...items[index], excerpt: e.target.value };
                            updateField('featured_reviews.items', items);
                          }}
                          className={getFieldClass(review.excerpt)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 11. Photo Gallery */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">11. Photo Gallery (6 images)</h3>
            <div className="space-y-4">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const image = formData.photo_gallery?.images?.[index] || {};
                return (
                  <div key={index} className="p-4 border-2 border-slate-200 rounded-lg">
                    <h4 className="font-semibold mb-3">Image {index + 1}</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Image URL</label>
                        <input
                          type="text"
                          value={image.image_url || ''}
                          onChange={(e) => {
                            const images = formData.photo_gallery?.images || [{}, {}, {}, {}, {}, {}];
                            images[index] = { ...images[index], image_url: e.target.value };
                            updateField('photo_gallery.images', images);
                          }}
                          className={getFieldClass(image.image_url)}
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Alt Text (SEO)</label>
                        <input
                          type="text"
                          value={image.alt || ''}
                          onChange={(e) => {
                            const images = formData.photo_gallery?.images || [{}, {}, {}, {}, {}, {}];
                            images[index] = { ...images[index], alt: e.target.value };
                            updateField('photo_gallery.images', images);
                          }}
                          className={getFieldClass(image.alt)}
                          placeholder="Descriptive alt text for SEO"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Note</label>
                <input
                  type="text"
                  value={formData.photo_gallery?.note || ''}
                  onChange={(e) => updateField('photo_gallery.note', e.target.value)}
                  className={getFieldClass(formData.photo_gallery?.note)}
                  placeholder="Additional activities detailed in Monthly Report"
                />
              </div>
            </div>
          </Card>

          {/* 12. Monthly Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">12. Monthly Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discover Package (comma-separated) {isMissing(formData.eyes_ai_monthly_activity?.discover) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.eyes_ai_monthly_activity?.discover?.join(', ') || ''}
                  onChange={(e) => updateField('eyes_ai_monthly_activity.discover', e.target.value.split(',').map((i: string) => i.trim()))}
                  className={getFieldClass(formData.eyes_ai_monthly_activity?.discover)}
                  placeholder="1 Blog, 1 Facebook, 1 YouTube, 1 X Post"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verified Package (comma-separated) {isMissing(formData.eyes_ai_monthly_activity?.verified) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.eyes_ai_monthly_activity?.verified?.join(', ') || ''}
                  onChange={(e) => updateField('eyes_ai_monthly_activity.verified', e.target.value.split(',').map((i: string) => i.trim()))}
                  className={getFieldClass(formData.eyes_ai_monthly_activity?.verified)}
                  placeholder="1 Blog, 1 Facebook, 1 YouTube, 1 X, 1 TikTok, 1 Instagram, 1 YouTube Short"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Activity Note</label>
                <input
                  type="text"
                  value={formData.eyes_ai_monthly_activity?.note || ''}
                  onChange={(e) => updateField('eyes_ai_monthly_activity.note', e.target.value)}
                  className={getFieldClass(formData.eyes_ai_monthly_activity?.note)}
                />
              </div>
            </div>
          </Card>

          {/* 13. Get in Touch */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">13. Get in Touch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name {isMissing(formData.get_in_touch?.company_name) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.get_in_touch?.company_name || ''}
                  onChange={(e) => updateField('get_in_touch.company_name', e.target.value)}
                  className={getFieldClass(formData.get_in_touch?.company_name)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City, State {isMissing(formData.get_in_touch?.city_state) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.get_in_touch?.city_state || ''}
                  onChange={(e) => updateField('get_in_touch.city_state', e.target.value)}
                  className={getFieldClass(formData.get_in_touch?.city_state)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
                <input
                  type="text"
                  value={formData.get_in_touch?.tagline || ''}
                  onChange={(e) => updateField('get_in_touch.tagline', e.target.value)}
                  className={getFieldClass(formData.get_in_touch?.tagline)}
                  placeholder="Eyes AI connects you directly to the business. No middleman, no fees."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Buttons (comma-separated) {isMissing(formData.get_in_touch?.buttons) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.get_in_touch?.buttons?.join(', ') || ''}
                  onChange={(e) => updateField('get_in_touch.buttons', e.target.value.split(',').map((b: string) => b.trim()))}
                  className={getFieldClass(formData.get_in_touch?.buttons)}
                  placeholder="Call Now, Visit Website, Send Message"
                />
              </div>
            </div>
          </Card>

          {/* 14. SEO & Schema */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">14. SEO & Schema</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">H1</label>
                <input
                  type="text"
                  value={formData.seo_and_schema?.h1 || ''}
                  onChange={(e) => updateField('seo_and_schema.h1', e.target.value)}
                  className={getFieldClass(formData.seo_and_schema?.h1)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  H2s (comma-separated, 4 items)
                </label>
                <textarea
                  value={formData.seo_and_schema?.h2s?.join(', ') || ''}
                  onChange={(e) => updateField('seo_and_schema.h2s', e.target.value.split(',').map((h: string) => h.trim()))}
                  className={getFieldClass(formData.seo_and_schema?.h2s)}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Title (60 chars)</label>
                <input
                  type="text"
                  value={formData.seo_and_schema?.meta_title_60 || ''}
                  onChange={(e) => updateField('seo_and_schema.meta_title_60', e.target.value)}
                  className={getFieldClass(formData.seo_and_schema?.meta_title_60)}
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description (160 chars)</label>
                <textarea
                  value={formData.seo_and_schema?.meta_description_160 || ''}
                  onChange={(e) => updateField('seo_and_schema.meta_description_160', e.target.value)}
                  className={getFieldClass(formData.seo_and_schema?.meta_description_160)}
                  rows={3}
                  maxLength={160}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">JSON-LD Schema (JSON object)</label>
                <textarea
                  value={JSON.stringify(formData.seo_and_schema?.jsonld_graph, null, 2) || ''}
                  onChange={(e) => {
                    try {
                      updateField('seo_and_schema.jsonld_graph', JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className={`${getFieldClass(formData.seo_and_schema?.jsonld_graph)} font-mono`}
                  rows={10}
                />
              </div>
            </div>
          </Card>

          {/* 15. Footer */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">15. Footer</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company {isMissing(formData.footer?.company) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.footer?.company || ''}
                  onChange={(e) => updateField('footer.company', e.target.value)}
                  className={getFieldClass(formData.footer?.company)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone (E.164) {isMissing(formData.footer?.phone_e164) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.footer?.phone_e164 || ''}
                  onChange={(e) => updateField('footer.phone_e164', e.target.value)}
                  className={getFieldClass(formData.footer?.phone_e164)}
                  placeholder="+15551234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email {isMissing(formData.footer?.email) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.footer?.email || ''}
                  onChange={(e) => updateField('footer.email', e.target.value)}
                  className={getFieldClass(formData.footer?.email)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website {isMissing(formData.footer?.website) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.footer?.website || ''}
                  onChange={(e) => updateField('footer.website', e.target.value)}
                  className={getFieldClass(formData.footer?.website)}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Visit Us Address {isMissing(formData.footer?.visit_us_address) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.footer?.visit_us_address || ''}
                  onChange={(e) => updateField('footer.visit_us_address', e.target.value)}
                  className={getFieldClass(formData.footer?.visit_us_address)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Get Directions URL {isMissing(formData.footer?.get_directions_url) && <span className="text-red-600">(Missing)</span>}
                </label>
                <input
                  type="text"
                  value={formData.footer?.get_directions_url || ''}
                  onChange={(e) => updateField('footer.get_directions_url', e.target.value)}
                  className={getFieldClass(formData.footer?.get_directions_url)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hours Recap</label>
                <input
                  type="text"
                  value={formData.footer?.hours_recap || ''}
                  onChange={(e) => updateField('footer.hours_recap', e.target.value)}
                  className={getFieldClass(formData.footer?.hours_recap)}
                  placeholder="Mon-Fri 9am-5pm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Social Links (JSON object)</label>
                <textarea
                  value={JSON.stringify(formData.footer?.social, null, 2) || ''}
                  onChange={(e) => {
                    try {
                      updateField('footer.social', JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className={`${getFieldClass(formData.footer?.social)} font-mono`}
                  rows={4}
                  placeholder='{"instagram": "https://...", "facebook": "https://..."}'
                />
              </div>
            </div>
          </Card>

          {/* 16. Audit */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">16. Audit</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phase</label>
                <input
                  type="text"
                  value={formData.audit?.phase || ''}
                  onChange={(e) => updateField('audit.phase', e.target.value)}
                  className={getFieldClass(formData.audit?.phase)}
                  placeholder="complete"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Updated</label>
                <input
                  type="text"
                  value={formData.audit?.last_updated || ''}
                  onChange={(e) => updateField('audit.last_updated', e.target.value)}
                  className={getFieldClass(formData.audit?.last_updated)}
                  placeholder="October 20, 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Resume Token</label>
                <input
                  type="text"
                  value={formData.audit?.resume_token || ''}
                  onChange={(e) => updateField('audit.resume_token', e.target.value)}
                  className={getFieldClass(formData.audit?.resume_token)}
                  placeholder="ROMA-OK"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">VA Tasks Grouped (JSON object)</label>
                <textarea
                  value={JSON.stringify(formData.audit?.va_tasks_grouped, null, 2) || ''}
                  onChange={(e) => {
                    try {
                      updateField('audit.va_tasks_grouped', JSON.parse(e.target.value));
                    } catch {}
                  }}
                  className={`${getFieldClass(formData.audit?.va_tasks_grouped)} font-mono`}
                  rows={8}
                  placeholder='{"Media": [...], "Content": [...], "Contact": [...]}'
                />
              </div>
            </div>
          </Card>

          {/* Success Message */}
          {formData.audit?.resume_token === 'ROMA-OK' && (
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-green-800 font-medium">
                ✅ ROMA-PDF data complete. Review all fields above (red = missing) and click "Save Intake" when ready.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}