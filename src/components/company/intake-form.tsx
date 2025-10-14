'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Company, Intake } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Save, 
  Building2, 
  FileText, 
  Star, 
  Globe, 
  Image as ImageIcon, 
  MessageSquare, 
  BarChart, 
  MapPin,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';

interface IntakeFormProps {
  company: Company;
}

export function IntakeForm({ company }: IntakeFormProps) {
  const saveIntake = useStore((state) => state.saveIntake);
  const updateCompanyFromIntake = useStore((state) => state.updateCompanyFromIntake);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  
  const existingIntake = getIntakeByCompanyId(company.id);

  const [activeTab, setActiveTab] = useState('part1');
  const [formData, setFormData] = useState<Partial<Intake>>(existingIntake || {
    id: `intake-${company.id}`,
    companyId: company.id,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasteIntake = async () => {
    if (!documentText.trim()) {
      setParseError('Please paste document text first');
      return;
    }

    setIsParsing(true);
    setParseError('');

    try {
      console.log('Sending document to AI for parsing...');

      const response = await fetch('/api/parse-intake-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        console.log('Document parsed successfully:', result.data);
        
        // Merge parsed data into formData
        setFormData(prev => ({
          ...prev,
          ...result.data,
        }));

        alert('✅ Document parsed successfully!\n\nAll fields have been auto-filled. Review the data and click "Save Draft" when ready.');
        setShowPasteModal(false);
        setDocumentText('');
      } else {
        throw new Error(result.error || 'Parsing failed');
      }
    } catch (error: any) {
      console.error('Parse error:', error);
      setParseError('❌ Failed to parse document: ' + error.message);
    } finally {
      setIsParsing(false);
    }
  };

  const saveDraft = () => {
    const intakeData: Intake = {
      ...formData,
      id: formData.id || `intake-${company.id}`,
      companyId: company.id,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    } as Intake;

    saveIntake(intakeData);
    alert('✅ Draft saved!');
  };

  const markComplete = () => {
    const intakeData: Intake = {
      ...formData,
      id: formData.id || `intake-${company.id}`,
      companyId: company.id,
      status: 'complete',
      completedAt: new Date().toISOString(),
      completedBy: 'VA',
      updatedAt: new Date().toISOString(),
    } as Intake;

    saveIntake(intakeData);
    updateCompanyFromIntake(company.id, intakeData);
    
    alert('✅ Intake marked complete!\n\nCompany status changed to ACTIVE.\nData is now saved and visible in Overview.');
    window.location.reload();
  };

  const tabs = [
    { id: 'part1', label: 'Part 1: Basic Info', icon: Building2 },
    { id: 'part2', label: 'Part 2: Contact', icon: FileText },
    { id: 'part3', label: 'Part 3: Geolocation', icon: MapPin },
    { id: 'part4', label: 'Part 4: Service Area', icon: MapPin },
    { id: 'part5', label: 'Part 5: Hours', icon: FileText },
    { id: 'part6', label: 'Part 6: Services', icon: FileText },
    { id: 'part7', label: 'Part 7: Reviews', icon: Star },
    { id: 'part8', label: 'Part 8: Metrics', icon: BarChart },
    { id: 'part9', label: 'Part 9: Social Media', icon: Globe },
    { id: 'part10', label: 'Part 10: Visual Assets', icon: ImageIcon },
    { id: 'part11', label: 'Part 11: FAQs', icon: MessageSquare },
    { id: 'seo', label: 'SEO Summary', icon: BarChart },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900">VA Intake Process</h3>
              <p className="text-sm text-slate-600 mt-1">
                Click "Paste Intake" to upload full document and AI will auto-fill all fields, or manually edit each section.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPasteModal(true)}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="sm"
            >
              <Sparkles className="w-4 h-4" />
              Paste Intake
            </Button>
            <Badge variant="secondary" className={formData.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
              {formData.status === 'complete' ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Paste Intake Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Paste Intake Document</h3>
                    <p className="text-sm text-slate-600">AI will automatically parse and fill all fields</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPasteModal(false);
                    setDocumentText('');
                    setParseError('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paste Complete Intake Document
                  </label>
                  <textarea
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    rows={25}
                    placeholder="Paste the entire intake document here (Part 1 - Basic Info, Part 2 - Contact, Part 3 - Geolocation, etc.)

Example:
Part 1 – Basic Business Information

Legal/Canonical Name: A & S Deli (trading as A&S Italian Marketplace / A&S Fine Foods Oceanside)
Also Known As (aliases): A&S Oceanside • A&S Fine Foods Oceanside
Industry / Category: Italian deli • Gourmet marketplace • Caterer
..."
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    {documentText.length.toLocaleString()} characters • AI will extract and populate all fields automatically
                  </p>
                </div>

                {parseError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{parseError}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasteModal(false);
                      setDocumentText('');
                      setParseError('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasteIntake}
                    disabled={isParsing || !documentText.trim()}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Parsing Document...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Auto-Fill All Fields
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1 flex-wrap h-auto">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="gap-2 data-[state=active]:bg-blue-50"
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* PART 1 - Basic Business Information */}
        <TabsContent value="part1" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 1 – Basic Business Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Legal/Canonical Name
                </label>
                <textarea
                  value={formData.legalCanonicalName || ''}
                  onChange={(e) => updateField('legalCanonicalName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="A & S Deli (trading as A&S Italian Marketplace / A&S Fine Foods Oceanside)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Also Known As (aliases)
                </label>
                <textarea
                  value={formData.alsoKnownAs || ''}
                  onChange={(e) => updateField('alsoKnownAs', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="A&S Oceanside • A&S Fine Foods Oceanside"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Industry / Category
                </label>
                <textarea
                  value={formData.industryCategoryBadges || ''}
                  onChange={(e) => updateField('industryCategoryBadges', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Italian deli • Gourmet marketplace • Caterer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Year Established (local store)
                </label>
                <textarea
                  value={formData.yearEstablished || ''}
                  onChange={(e) => updateField('yearEstablished', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="1985 (A&S Oceanside lineage from A&S Fine Foods founded 1948)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ownership / Heritage
                </label>
                <textarea
                  value={formData.ownershipHeritage || ''}
                  onChange={(e) => updateField('ownershipHeritage', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Family-owned; Nicolo family (owner: Anthony Nicolo)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Status
                </label>
                <textarea
                  value={formData.businessStatus || ''}
                  onChange={(e) => updateField('businessStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Open for walk-in orders, catering, and online ordering (pickup/delivery via partners)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tagline/Slogan (site)
                </label>
                <input
                  type="text"
                  value={formData.taglineSlogan || ''}
                  onChange={(e) => updateField('taglineSlogan', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder='"Dine as if you were in Italy."'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Short Description
                </label>
                <textarea
                  value={formData.shortDescription || ''}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={3}
                  placeholder="Long-running Italian deli & marketplace offering heroes, hot/cold prepared foods, fresh meats and cheeses, housemade specialties, and full catering."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification Tier
                </label>
                <input
                  type="text"
                  value={formData.verificationTier || ''}
                  onChange={(e) => updateField('verificationTier', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="Verified"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 2 - Contact Information */}
        <TabsContent value="part2" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 2 – Contact Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="https://asoceanside.com/"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Phone
                </label>
                <input
                  type="text"
                  value={formData.mainPhone || ''}
                  onChange={(e) => updateField('mainPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="(516) 764-4606 (digits: 5167644606)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address (NAP)
                </label>
                <input
                  type="text"
                  value={formData.physicalAddress || ''}
                  onChange={(e) => updateField('physicalAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="3382 Long Beach Rd, Oceanside, NY 11572"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Online Ordering
                </label>
                <textarea
                  value={formData.onlineOrdering || ''}
                  onChange={(e) => updateField('onlineOrdering', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="ChowNow • DoorDash • Grubhub"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <textarea
                  value={typeof formData.emails === 'string' ? formData.emails : (Array.isArray(formData.emails) ? formData.emails.join('\n') : '')}
                  onChange={(e) => updateField('emails', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Not published on official site (newsletter signup only). Neutral fallback: use phone/ordering links."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Canonical Domain
                </label>
                <input
                  type="url"
                  value={formData.canonicalDomain || ''}
                  onChange={(e) => updateField('canonicalDomain', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="https://asoceanside.com/ (www/non-www resolved)"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 3 - Geolocation Data */}
        <TabsContent value="part3" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 3 – Geolocation Data</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Latitude/Longitude
                </label>
                <input
                  type="text"
                  value={formData.latitudeLongitude || ''}
                  onChange={(e) => updateField('latitudeLongitude', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="40.62844, −73.64153 (parcel centroid for 3382 Long Beach Rd)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Geo Source
                </label>
                <textarea
                  value={formData.geoSource || ''}
                  onChange={(e) => updateField('geoSource', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="MapQuest geocoded address page for 3382 Long Beach Rd."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 4 - Service Area / Delivery Zone */}
        <TabsContent value="part4" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 4 – Service Area / Delivery Zone</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Local Focus
                </label>
                <textarea
                  value={formData.localFocus || ''}
                  onChange={(e) => updateField('localFocus', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Oceanside, NY + nearby South Shore Nassau towns."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Nearby Towns (in-store/catering reach)
                </label>
                <textarea
                  value={formData.primaryNearbyTowns || ''}
                  onChange={(e) => updateField('primaryNearbyTowns', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={3}
                  placeholder="Rockville Centre, Baldwin, Lynbrook, East Rockaway, Island Park, Long Beach. (Inferred from locality; confirm per order partners at checkout.)"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 5 - Business Hours & Availability */}
        <TabsContent value="part5" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 5 – Business Hours & Availability</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Store Hours
                </label>
                <textarea
                  value={formData.businessHours || ''}
                  onChange={(e) => updateField('businessHours', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={3}
                  placeholder="Not explicitly published on official site. Third-party listings show daily opening around 8:00 AM; verify by phone before visiting. (Neutral fallback used.)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Response Time
                </label>
                <textarea
                  value={formData.responseTime || ''}
                  onChange={(e) => updateField('responseTime', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Same-day for in-store orders; catering lead times vary by menu/season."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 6 - Services / Products Offered */}
        <TabsContent value="part6" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 6 – Services / Products Offered</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Services / Products Offered (Full Text)
                </label>
                <textarea
                  value={formData.servicesOffered || ''}
                  onChange={(e) => updateField('servicesOffered', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={20}
                  placeholder="Italian Deli & Marketplace
- Heroes, Sandwiches & Wraps — Cold cuts, Italian combos, chicken cutlet builds. Duration: 5–15 min typical. Notes: Custom builds available.
- Hot Prepared Foods — Chicken parm/francaise, sausage & peppers, eggplant, pasta trays. Notes: Daily rotation.
..."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 7 - Reviews & Reputation */}
        <TabsContent value="part7" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 7 – Reviews & Reputation</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ⭐ Verified 5-Star Reviews (Total)
                </label>
                <input
                  type="text"
                  value={formData.verifiedFiveStarTotal || ''}
                  onChange={(e) => updateField('verifiedFiveStarTotal', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="N/A (platform 5-star breakdowns not exposed) — Accessed October 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Google Reviews (Total)
                </label>
                <input
                  type="text"
                  value={formData.googleReviewsTotal || ''}
                  onChange={(e) => updateField('googleReviewsTotal', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="N/A (count not visible without JS; direct listing link provided)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Review Links
                </label>
                <textarea
                  value={formData.reviewLinks || ''}
                  onChange={(e) => updateField('reviewLinks', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={3}
                  placeholder="[Google Maps] (maps search for 'A&S Fine Foods Oceanside NY') | [Yelp] (...) | [Facebook] (...) | [TripAdvisor] (...) | [Ordering/Delivery] (...)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Yelp Info
                </label>
                <textarea
                  value={formData.yelpInfo || ''}
                  onChange={(e) => updateField('yelpInfo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Active listing with recent reviews; hours and phone match NAP."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Facebook Info
                </label>
                <textarea
                  value={formData.facebookInfo || ''}
                  onChange={(e) => updateField('facebookInfo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Official page, >5K likes; branding matches store."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  TripAdvisor Info
                </label>
                <textarea
                  value={formData.tripadvisorInfo || ''}
                  onChange={(e) => updateField('tripadvisorInfo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Take-out/high-end deli notes; aligns with marketplace model."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Direct Profiles
                </label>
                <textarea
                  value={formData.directProfiles || ''}
                  onChange={(e) => updateField('directProfiles', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={5}
                  placeholder="• Google Maps (search entry): https://www.google.com/maps/search/?api=1&query=...
- Yelp: https://www.yelp.com/biz/...
- Facebook: https://www.facebook.com/...
- TripAdvisor: https://www.tripadvisor.com/..."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 8 - Key Metrics & Differentiators */}
        <TabsContent value="part8" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 8 – Key Metrics & Differentiators</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quick Facts
                </label>
                <textarea
                  value={formData.quickFacts || ''}
                  onChange={(e) => updateField('quickFacts', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={4}
                  placeholder="• Serving Oceanside community 35+ years (est. 1985)
- Family-owned; multi-generation Nicolo family leadership
- Full catering + seasonal holiday menus; online ordering via partners"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary SEO Keywords (9)
                </label>
                <textarea
                  value={formData.primarySeoKeywords || ''}
                  onChange={(e) => updateField('primarySeoKeywords', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={4}
                  placeholder="italian deli oceanside ny • italian catering oceanside • heroes and sandwiches oceanside • prepared italian foods long island • mozzarella and salumi oceanside • holiday catering long island • italian marketplace oceanside • pasta trays oceanside ny • antipasto platters oceanside"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verified/Fallback Badges (best-fit)
                </label>
                <textarea
                  value={formData.verifiedFallbackBadges || ''}
                  onChange={(e) => updateField('verifiedFallbackBadges', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={6}
                  placeholder="✅ Family-Owned Since 1985
✅ Local Favorite (South Shore Nassau)
✅ Same-Day Service Available (in-store orders)
✅ Friendly Customer Service
✅ High Customer Satisfaction (consistent positive third-party reviews)"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 9 - Social Media & Media Links */}
        <TabsContent value="part9" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 9 – Social Media & Media Links</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl || ''}
                  onChange={(e) => updateField('instagramUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="https://www.instagram.com/asfinefoodoceanside/"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl || ''}
                  onChange={(e) => updateField('facebookUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="https://www.facebook.com/asfinefoodsoceanside/"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gallery (official)
                </label>
                <input
                  type="url"
                  value={formData.galleryUrl || ''}
                  onChange={(e) => updateField('galleryUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="https://asoceanside.com/gallery/"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipes
                </label>
                <input
                  type="url"
                  value={formData.recipesUrl || ''}
                  onChange={(e) => updateField('recipesUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="https://asoceanside.com/recipes/"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 10 - Visual Assets / Gallery */}
        <TabsContent value="part10" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 10 – Visual Assets / Gallery</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Visual Assets Description
                </label>
                <textarea
                  value={formData.visualAssets || ''}
                  onChange={(e) => updateField('visualAssets', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={3}
                  placeholder="Representative product/store imagery available on the Gallery page (prepared foods, butcher case, pantry shelves) for CMS use; ensure alt-text includes dish/item name and 'A&S Oceanside.'"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PART 11 - FAQs */}
        <TabsContent value="part11" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Part 11 – FAQs (SEO-optimized by Eyes AI)</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  FAQs (Full Text - paste all 12 questions and answers)
                </label>
                <textarea
                  value={formData.faqs || ''}
                  onChange={(e) => updateField('faqs', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={25}
                  placeholder="1. Do you offer catering for parties and holidays? Yes—full trays, party packages, and seasonal holiday menus are available; order ahead.
2. How do I place an online order for pickup or delivery? Use ChowNow (pickup) or third-party delivery partners like DoorDash/Grubhub.
..."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SEO SUMMARY */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">SEO Summary (90+ Ready)</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Change Log & Confidence Gaps
                </label>
                <textarea
                  value={formData.changeLogConfidenceGaps || ''}
                  onChange={(e) => updateField('changeLogConfidenceGaps', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={8}
                  placeholder="• Name/Branding: Canonical trading name appears as 'A&S Oceanside / A&S Fine Foods Oceanside.' Alias recorded for 'A & S Deli.'
- Email: No explicit store email on official site (newsletter only). Neutral fallback retained.
..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Comparative Value Table
                </label>
                <textarea
                  value={formData.comparativeValueTable || ''}
                  onChange={(e) => updateField('comparativeValueTable', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={8}
                  placeholder="Feature | A&S Oceanside | Typical Competitor
Years serving area | 35+ years (since 1985) | 5–15 years
Ownership | Family-owned (multi-generation) | Varies
..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Title (≤60)
                </label>
                <input
                  type="text"
                  value={formData.metaTitle || ''}
                  onChange={(e) => updateField('metaTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="A&S Oceanside – Italian Deli, Catering & Marketplace in Oceanside, NY"
                  maxLength={60}
                />
                <p className="text-xs text-slate-500 mt-1">{(formData.metaTitle || '').length}/60 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Description (≤160)
                </label>
                <textarea
                  value={formData.metaDescription || ''}
                  onChange={(e) => updateField('metaDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={3}
                  placeholder="Family-owned since 1985. Heroes, prepared Italian foods, butcher & cheeses, full catering, and seasonal holiday menus. Order online or visit A&S in Oceanside."
                  maxLength={160}
                />
                <p className="text-xs text-slate-500 mt-1">{(formData.metaDescription || '').length}/160 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  JSON-LD Schema (LocalBusiness + Organization + Offerings + FAQPage)
                </label>
                <textarea
                  value={formData.jsonLdSchema || ''}
                  onChange={(e) => updateField('jsonLdSchema', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={40}
                  placeholder='<script type="application/ld+json">
{
  "@context":"https://schema.org",
  "@type":"LocalBusiness",
  ...
}
</script>'
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Internal Links (≥3)
                </label>
                <textarea
                  value={formData.internalLinks || ''}
                  onChange={(e) => updateField('internalLinks', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Menus • Catering • Holiday Menus • Gallery • Recipes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  External Citations (≥2)
                </label>
                <textarea
                  value={formData.externalCitations || ''}
                  onChange={(e) => updateField('externalCitations', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  rows={2}
                  placeholder="Yelp • TripAdvisor • Facebook (official)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Schema Elements Included
                </label>
                <input
                  type="text"
                  value={formData.schemaElementsIncluded || ''}
                  onChange={(e) => updateField('schemaElementsIncluded', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="LocalBusiness, Organization, GeoCoordinates, Offer, Menu, FAQPage, sameAs (social), areaServed, slogan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  AI Discovery Tier
                </label>
                <input
                  type="text"
                  value={formData.aiDiscoveryTier || ''}
                  onChange={(e) => updateField('aiDiscoveryTier', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="Verified"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Updated Date
                </label>
                <input
                  type="text"
                  value={formData.lastUpdatedDate || ''}
                  onChange={(e) => updateField('lastUpdatedDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="10/14/2025"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div className="text-sm text-slate-600">
          Paste document using AI or manually edit fields → Save Draft → Mark Complete
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={saveDraft} className="gap-2">
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button onClick={markComplete} className="gap-2 bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4" />
            Mark Complete
          </Button>
        </div>
      </div>
    </div>
  );
}