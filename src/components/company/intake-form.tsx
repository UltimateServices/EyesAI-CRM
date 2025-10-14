'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Sparkles, Save, Check, MapPin } from 'lucide-react';

interface IntakeFormProps {
  company: Company;
}

export function IntakeForm({ company }: IntakeFormProps) {
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const saveIntake = useStore((state) => state.saveIntake);

  const intake = getIntakeByCompanyId(company.id);

  const [formData, setFormData] = useState({
    // Part 1
    legalCanonicalName: intake?.legalCanonicalName || '',
    alsoKnownAs: intake?.alsoKnownAs || '',
    industryCategoryBadges: intake?.industryCategoryBadges || '',
    yearEstablished: intake?.yearEstablished || '',
    ownershipHeritage: intake?.ownershipHeritage || '',
    businessStatus: intake?.businessStatus || '',
    taglineSlogan: intake?.taglineSlogan || '',
    shortDescription: intake?.shortDescription || '',
    verificationTier: intake?.verificationTier || '',
    
    // Part 2
    officialName: intake?.officialName || '',
    website: intake?.website || '',
    mainPhone: intake?.mainPhone || '',
    physicalAddress: intake?.physicalAddress || '',
    onlineOrdering: intake?.onlineOrdering || '',
    emails: intake?.emails || '',
    canonicalDomain: intake?.canonicalDomain || '',
    
    // Part 3
    latitudeLongitude: intake?.latitudeLongitude || '',
    geoSource: intake?.geoSource || '',
    
    // Part 4
    localFocus: intake?.localFocus || '',
    primaryNearbyTowns: intake?.primaryNearbyTowns || '',
    
    // Part 5
    businessHours: intake?.businessHours || '',
    responseTime: intake?.responseTime || '',
    
    // Part 6
    servicesOffered: intake?.servicesOffered || '',
    
    // Part 7
    verifiedFiveStarTotal: intake?.verifiedFiveStarTotal || '',
    googleReviewsTotal: intake?.googleReviewsTotal || '',
    reviewLinks: intake?.reviewLinks || '',
    yelpInfo: intake?.yelpInfo || '',
    facebookInfo: intake?.facebookInfo || '',
    tripadvisorInfo: intake?.tripadvisorInfo || '',
    directProfiles: intake?.directProfiles || '',
    googleMapsLink1: intake?.googleMapsLink1 || '',
    googleMapsLink2: intake?.googleMapsLink2 || '',
    googleMapsLink3: intake?.googleMapsLink3 || '',
    googleMapsLink4: intake?.googleMapsLink4 || '',
    googleMapsLink5: intake?.googleMapsLink5 || '',
    
    // Part 8
    quickFacts: intake?.quickFacts || '',
    primarySeoKeywords: intake?.primarySeoKeywords || '',
    verifiedFallbackBadges: intake?.verifiedFallbackBadges || '',
    
    // Part 9
    socialMediaLinks: intake?.socialMediaLinks || '',
    instagramUrl: intake?.instagramUrl || '',
    facebookUrl: intake?.facebookUrl || '',
    galleryUrl: intake?.galleryUrl || '',
    recipesUrl: intake?.recipesUrl || '',
    
    // Part 10
    visualAssets: intake?.visualAssets || '',
    logoUrl: intake?.logoUrl || '',
    
    // Part 11
    faqs: intake?.faqs || '',
  });

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    const intakeData = {
      id: intake?.id || `intake-${company.id}`,
      companyId: company.id,
      status: 'draft' as const,
      ...formData,
      createdAt: intake?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveIntake(intakeData);
    alert('✅ Draft saved successfully!');
  };

  const handleMarkComplete = () => {
    const intakeData = {
      id: intake?.id || `intake-${company.id}`,
      companyId: company.id,
      status: 'complete' as const,
      ...formData,
      createdAt: intake?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    saveIntake(intakeData);
    alert('✅ Intake marked as complete!');
  };

  const handlePasteIntake = async () => {
    if (!pasteText.trim()) {
      alert('Please paste the intake document');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/parse-intake-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          document: pasteText,
          companyName: company.name 
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse document');
      }

      setFormData(prev => ({
        ...prev,
        ...result.data,
      }));

      setShowPasteModal(false);
      setPasteText('');
      alert('✅ Document parsed successfully! Review the fields and save.');
    } catch (error: any) {
      console.error('Parse error:', error);
      alert('❌ Failed to parse document: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">VA Intake Process</h2>
            <p className="text-sm text-slate-600">
              Click "Paste Intake" to upload full document and AI will auto-fill all fields, or manually edit each section.
            </p>
          </div>
          <Button onClick={() => setShowPasteModal(true)} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Paste Intake
          </Button>
        </div>
      </Card>

      {showPasteModal && (
        <Card className="p-6 border-2 border-blue-300">
          <h3 className="text-lg font-semibold mb-3">Paste Intake Document</h3>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="w-full h-64 p-3 border border-slate-300 rounded-lg text-sm font-mono"
            placeholder="Paste the entire intake document here..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPasteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasteIntake} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Auto-Fill with AI'}
            </Button>
          </div>
        </Card>
      )}

      {/* Part 1 - Basic Info */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
          Part 1 – Basic Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Legal/Canonical Name
            </label>
            <input
              type="text"
              value={formData.legalCanonicalName}
              onChange={(e) => handleFieldChange('legalCanonicalName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Also Known As (AKA)
            </label>
            <input
              type="text"
              value={formData.alsoKnownAs}
              onChange={(e) => handleFieldChange('alsoKnownAs', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Industry Category Badges
            </label>
            <input
              type="text"
              value={formData.industryCategoryBadges}
              onChange={(e) => handleFieldChange('industryCategoryBadges', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Year Established
            </label>
            <input
              type="text"
              value={formData.yearEstablished}
              onChange={(e) => handleFieldChange('yearEstablished', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ownership Heritage
            </label>
            <input
              type="text"
              value={formData.ownershipHeritage}
              onChange={(e) => handleFieldChange('ownershipHeritage', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Business Status
            </label>
            <input
              type="text"
              value={formData.businessStatus}
              onChange={(e) => handleFieldChange('businessStatus', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tagline/Slogan
            </label>
            <input
              type="text"
              value={formData.taglineSlogan}
              onChange={(e) => handleFieldChange('taglineSlogan', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Short Description
            </label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Part 2 - Contact */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          Part 2 – Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Official Name
            </label>
            <input
              type="text"
              value={formData.officialName}
              onChange={(e) => handleFieldChange('officialName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleFieldChange('website', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Main Phone
            </label>
            <input
              type="tel"
              value={formData.mainPhone}
              onChange={(e) => handleFieldChange('mainPhone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Physical Address
            </label>
            <input
              type="text"
              value={formData.physicalAddress}
              onChange={(e) => handleFieldChange('physicalAddress', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Online Ordering
            </label>
            <input
              type="text"
              value={formData.onlineOrdering}
              onChange={(e) => handleFieldChange('onlineOrdering', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Emails
            </label>
            <input
              type="text"
              value={formData.emails}
              onChange={(e) => handleFieldChange('emails', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Part 3 - Geolocation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
          Part 3 – Geolocation Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Latitude/Longitude
            </label>
            <input
              type="text"
              value={formData.latitudeLongitude}
              onChange={(e) => handleFieldChange('latitudeLongitude', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Geo Source
            </label>
            <input
              type="text"
              value={formData.geoSource}
              onChange={(e) => handleFieldChange('geoSource', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Part 4 - Service Area */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
          Part 4 – Service Area / Delivery Zone
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Local Focus
            </label>
            <textarea
              value={formData.localFocus}
              onChange={(e) => handleFieldChange('localFocus', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary Nearby Towns
            </label>
            <textarea
              value={formData.primaryNearbyTowns}
              onChange={(e) => handleFieldChange('primaryNearbyTowns', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Part 5 - Hours */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
          Part 5 – Business Hours & Availability
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Business Hours
            </label>
            <textarea
              value={formData.businessHours}
              onChange={(e) => handleFieldChange('businessHours', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Response Time
            </label>
            <input
              type="text"
              value={formData.responseTime}
              onChange={(e) => handleFieldChange('responseTime', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Part 6 - Services */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
          Part 6 – Services / Products Offered
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Services Offered
          </label>
          <textarea
            value={formData.servicesOffered}
            onChange={(e) => handleFieldChange('servicesOffered', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            rows={4}
          />
        </div>
      </Card>

      {/* Part 7 - Reviews */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
          Part 7 – Reviews & Reputation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ⭐ Verified 5-Star Reviews (Total)
            </label>
            <input
              type="text"
              value={formData.verifiedFiveStarTotal}
              onChange={(e) => handleFieldChange('verifiedFiveStarTotal', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Google Reviews (Total)
            </label>
            <input
              type="text"
              value={formData.googleReviewsTotal}
              onChange={(e) => handleFieldChange('googleReviewsTotal', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Review Links
            </label>
            <textarea
              value={formData.reviewLinks}
              onChange={(e) => handleFieldChange('reviewLinks', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Yelp Info
            </label>
            <textarea
              value={formData.yelpInfo}
              onChange={(e) => handleFieldChange('yelpInfo', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Facebook Info
            </label>
            <textarea
              value={formData.facebookInfo}
              onChange={(e) => handleFieldChange('facebookInfo', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              TripAdvisor Info
            </label>
            <textarea
              value={formData.tripadvisorInfo}
              onChange={(e) => handleFieldChange('tripadvisorInfo', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Direct Profiles
            </label>
            <textarea
              value={formData.directProfiles}
              onChange={(e) => handleFieldChange('directProfiles', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
          </div>

          {/* Manual Google Maps Links Section */}
          <div className="col-span-2 mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Manual Google Maps Links
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              If Google Maps URLs aren't in the intake document, add them manually here. These will be used for review import.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Location 1 - Google Maps URL
                </label>
                <input
                  type="url"
                  value={formData.googleMapsLink1}
                  onChange={(e) => handleFieldChange('googleMapsLink1', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Location 2 - Google Maps URL
                </label>
                <input
                  type="url"
                  value={formData.googleMapsLink2}
                  onChange={(e) => handleFieldChange('googleMapsLink2', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Location 3 - Google Maps URL
                </label>
                <input
                  type="url"
                  value={formData.googleMapsLink3}
                  onChange={(e) => handleFieldChange('googleMapsLink3', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Location 4 - Google Maps URL
                </label>
                <input
                  type="url"
                  value={formData.googleMapsLink4}
                  onChange={(e) => handleFieldChange('googleMapsLink4', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Location 5 - Google Maps URL
                </label>
                <input
                  type="url"
                  value={formData.googleMapsLink5}
                  onChange={(e) => handleFieldChange('googleMapsLink5', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-white rounded border border-blue-200">
              <p className="text-xs text-slate-600">
                <strong>💡 Tip:</strong> Right-click on business in Google Maps → Share → Copy link, then paste here
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Part 8 - Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
          Part 8 – Key Metrics & Differentiators
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quick Facts
            </label>
            <textarea
              value={formData.quickFacts}
              onChange={(e) => handleFieldChange('quickFacts', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Primary SEO Keywords
            </label>
            <input
              type="text"
              value={formData.primarySeoKeywords}
              onChange={(e) => handleFieldChange('primarySeoKeywords', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Part 9 - Social Media */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">9</span>
          Part 9 – Social Media & Media Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Social Media Links
            </label>
            <textarea
              value={formData.socialMediaLinks}
              onChange={(e) => handleFieldChange('socialMediaLinks', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Instagram URL
            </label>
            <input
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => handleFieldChange('instagramUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Facebook URL
            </label>
            <input
              type="url"
              value={formData.facebookUrl}
              onChange={(e) => handleFieldChange('facebookUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Part 10 - Visual Assets */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">10</span>
          Part 10 – Visual Assets / Gallery
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Visual Assets
            </label>
            <textarea
              value={formData.visualAssets}
              onChange={(e) => handleFieldChange('visualAssets', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Part 11 - FAQs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">11</span>
          Part 11 – FAQs
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            FAQs
          </label>
          <textarea
            value={formData.faqs}
            onChange={(e) => handleFieldChange('faqs', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            rows={6}
          />
        </div>
      </Card>

      {/* Save Buttons */}
      <Card className="p-4 bg-slate-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Paste document using AI or manually edit fields → Save Draft → Mark Complete
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            <Button onClick={handleMarkComplete} className="gap-2 bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4" />
              Mark Complete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}