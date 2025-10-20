'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Company, Intake } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Loader2,
  Sparkles,
  Search,
  CheckCircle
} from 'lucide-react';

interface IntakeFormProps {
  company: Company;
}

export function IntakeForm({ company }: IntakeFormProps) {
  const saveIntake = useStore((state) => state.saveIntake);
  const updateCompanyFromIntake = useStore((state) => state.updateCompanyFromIntake);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  
  const existingIntake = getIntakeByCompanyId(company.id);

  const [isRunning, setIsRunning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [formData, setFormData] = useState<any>(existingIntake?.romaData || {
    template: "EyesAI-Roma-PDF",
    profile_layout_version: "Roma-v10.3",
    category: "",
    ai_overview: {
      overview_line: "",
      last_verified: ""
    },
    hero: {
      logo_url: "",
      company_name: company.name,
      eyes_handle: "",
      descriptor_line: "",
      quick_actions: {
        call_tel: "",
        website_url: company.website || "",
        email_mailto: "",
        maps_link: ""
      },
      badges: []
    },
    about_and_badges: {
      ai_summary_120w: "",
      company_badges: []
    },
    services_section_title: "Our Services",
    services: [],
    // ... other ROMA fields
  });

  // Common business categories
  const businessCategories = [
    "Home Services",
    "Beauty & Personal Care", 
    "Restaurant & Food",
    "Retail & Shopping",
    "Professional Services",
    "Healthcare & Wellness",
    "Automotive",
    "Technology & IT",
    "Education & Training",
    "Real Estate",
    "Construction & Contractors",
    "Legal Services",
    "Financial Services",
    "Entertainment & Events",
    "Travel & Hospitality",
    "Fitness & Sports",
    "Pet Services",
    "Cleaning Services",
    "Photography & Video",
    "Marketing & Advertising",
    "Other"
  ];

  const handleRunIntake = async () => {
    if (!company.website) {
      alert('❌ No website URL found. Please add a website to the company first.');
      return;
    }

    setIsRunning(true);
    setStatusMessage('🚀 Analyzing website...');

    try {
      const response = await fetch('/api/run-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          website: company.website,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFormData(result.data);
        setStatusMessage('✅ Intake complete! Review the data below.');
        setTimeout(() => setStatusMessage(''), 5000);
      } else {
        throw new Error(result.error || 'Failed to run intake');
      }
    } catch (error: any) {
      console.error('Run intake error:', error);
      setStatusMessage('❌ Error: ' + error.message);
      alert('❌ Failed to run intake: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSearchForMissing = async () => {
    setIsSearching(true);
    setStatusMessage('🔍 Searching for missing data...');

    try {
      // Find empty/missing fields
      const missingFields = [];
      
      if (!formData.hero?.quick_actions?.call_tel || formData.hero.quick_actions.call_tel === 'tel:<>') {
        missingFields.push('phone');
      }
      if (!formData.hero?.quick_actions?.email_mailto || formData.hero.quick_actions.email_mailto === 'mailto:<>') {
        missingFields.push('email');
      }
      if (!formData.hero?.quick_actions?.maps_link || formData.hero.quick_actions.maps_link.includes('<>')) {
        missingFields.push('address');
      }
      if (!formData.locations_and_hours?.locations?.[0]?.opening_hours?.length) {
        missingFields.push('hours');
      }
      if (!formData.featured_reviews?.items?.length) {
        missingFields.push('reviews');
      }

      if (missingFields.length === 0) {
        setStatusMessage('✅ All fields are complete!');
        setTimeout(() => setStatusMessage(''), 3000);
        setIsSearching(false);
        return;
      }

      // TODO: Implement search for missing data
      // This would use additional API calls to find:
      // - Google Business Profile for hours/address
      // - Review platforms for reviews
      // - Social media for additional info
      
      setStatusMessage(`🔍 Found ${missingFields.length} missing fields: ${missingFields.join(', ')}`);
      alert('Search for missing data feature coming soon!\n\nMissing: ' + missingFields.join(', '));
      
    } catch (error: any) {
      setStatusMessage('❌ Search failed');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setStatusMessage('💾 Saving...');

    try {
      const intakeData: Intake = {
        id: existingIntake?.id || `intake-${company.id}`,
        companyId: company.id,
        status: 'draft',
        romaData: formData,
        createdAt: existingIntake?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveIntake(intakeData);
      setStatusMessage('✅ Draft saved!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error: any) {
      console.error('Save error:', error);
      setStatusMessage('❌ Save failed');
      alert('Failed to save: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!formData.audit?.resume_token || formData.audit.resume_token !== 'ROMA-OK') {
      alert('❌ Please run intake first before marking complete.');
      return;
    }

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
    
    alert('✅ Intake marked complete!\n\nCompany status changed to ACTIVE.\nData is now visible in Overview.');
    setStatusMessage('✅ Intake complete!');
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">ROMA-PDF Intake</h2>
            <p className="text-slate-600">Complete business profile data collection for {company.name}</p>
          </div>
          <Badge variant={existingIntake?.status === 'complete' ? 'default' : 'secondary'}>
            {existingIntake?.status || 'new'}
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleRunIntake}
            disabled={isRunning || !company.website}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Intake...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Intake
              </>
            )}
          </Button>

          <Button 
            onClick={handleSearchForMissing}
            disabled={isSearching || !formData.category}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search for Missing
              </>
            )}
          </Button>

          <Button 
            onClick={handleSaveDraft}
            disabled={isSaving}
            variant="outline"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>

          <Button 
            onClick={handleMarkComplete}
            disabled={!formData.audit?.resume_token}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{statusMessage}</p>
          </div>
        )}
      </Card>

      {/* Business Category & AI Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🏢</span>
          Business Category & AI Overview
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Business Category
            </label>
            <select
              value={formData.category || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select category...</option>
              {businessCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              AI Overview Line
            </label>
            <textarea
              value={formData.ai_overview?.overview_line || ""}
              onChange={(e) => setFormData({
                ...formData,
                ai_overview: { ...formData.ai_overview, overview_line: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
              placeholder="One sentence summary for AI assistants and search..."
            />
          </div>
        </div>
      </Card>

      {/* Hero Section & Contact Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🌐</span>
          Hero Section & Contact Info
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo URL
            </label>
            <input
              type="text"
              value={formData.hero?.logo_url || ""}
              onChange={(e) => setFormData({
                ...formData,
                hero: { ...formData.hero, logo_url: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={formData.hero?.company_name || company.name}
              onChange={(e) => setFormData({
                ...formData,
                hero: { ...formData.hero, company_name: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Eyes Handle
            </label>
            <input
              type="text"
              value={formData.hero?.eyes_handle || ""}
              onChange={(e) => setFormData({
                ...formData,
                hero: { ...formData.hero, eyes_handle: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="@major-dumpsters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tagline/Descriptor
            </label>
            <input
              type="text"
              value={formData.hero?.descriptor_line || ""}
              onChange={(e) => setFormData({
                ...formData,
                hero: { ...formData.hero, descriptor_line: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Short tagline or service description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Website URL
            </label>
            <input
              type="text"
              value={formData.hero?.quick_actions?.website_url || ""}
              onChange={(e) => setFormData({
                ...formData,
                hero: { 
                  ...formData.hero, 
                  quick_actions: { ...formData.hero?.quick_actions, website_url: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.hero?.quick_actions?.call_tel || ""}
              onChange={(e) => setFormData({
                ...formData,
                hero: { 
                  ...formData.hero, 
                  quick_actions: { ...formData.hero?.quick_actions, call_tel: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="tel:+15551234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="text"
              value={formData.hero?.quick_actions?.email_mailto || ""}
              onChange={(e) => setFormData({
                ...formData,
                hero: { 
                  ...formData.hero, 
                  quick_actions: { ...formData.hero?.quick_actions, email_mailto: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="mailto:contact@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Main Address
            </label>
            <input
              type="text"
              value={formData.hero?.quick_actions?.maps_link || ""}
              onChange={(e) => setFormData({
                ...formData,
                hero: { 
                  ...formData.hero, 
                  quick_actions: { ...formData.hero?.quick_actions, maps_link: e.target.value }
                }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="https://maps.google.com/?q=..."
            />
          </div>
        </div>
      </Card>

      {/* About Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>👥</span>
          About Section & Company Badges
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              About Summary (120 words)
            </label>
            <textarea
              value={formData.about_and_badges?.ai_summary_120w || ""}
              onChange={(e) => setFormData({
                ...formData,
                about_and_badges: { ...formData.about_and_badges, ai_summary_120w: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={5}
              placeholder="Comprehensive business overview, services, and what makes you unique..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Quality Badges (comma-separated)
            </label>
            <input
              type="text"
              value={formData.about_and_badges?.company_badges?.join(', ') || ""}
              onChange={(e) => setFormData({
                ...formData,
                about_and_badges: { 
                  ...formData.about_and_badges, 
                  company_badges: e.target.value.split(',').map(b => b.trim())
                }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder='e.g., "Professional", "Licensed", "Family-Owned"'
            />
          </div>
        </div>
      </Card>

      {/* Services Preview */}
      {formData.services && formData.services.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>⭐</span>
            Services ({formData.services.length})
          </h3>
          <div className="space-y-3">
            {formData.services.map((service: any, index: number) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg">
                <p className="font-medium text-slate-900">
                  {service.emoji} {service.title}
                </p>
                <p className="text-sm text-slate-600 mt-1">{service.summary_1line}</p>
                <p className="text-sm text-blue-600 mt-2 font-medium">{service.pricing_label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Data Preview */}
      {formData.audit?.resume_token === 'ROMA-OK' && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">✅ Intake Data Ready</h3>
              <p className="text-sm text-green-800 mb-3">
                ROMA profile generated successfully! Review the data above and click "Mark Complete" when ready.
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-green-700 font-medium">View Full JSON</summary>
                <pre className="mt-3 p-3 bg-white border border-green-200 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}