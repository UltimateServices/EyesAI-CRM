'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, Loader2 } from 'lucide-react';

interface IntakeFormProps {
  company: Company;
}

export function IntakeForm({ company }: IntakeFormProps) {
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const saveIntake = useStore((state) => state.saveIntake);

  const intake = getIntakeByCompanyId(company.id);

  const [formData, setFormData] = useState({
    legalName: '',
    displayName: '',
    tagline: '',
    industryCategory: '',
    yearEstablished: '',
    ownerPrincipal: '',
    ownershipType: '',
    verificationTier: 'Basic',
    businessStatus: 'Open',
    shortDescription: '',
    officePhone: '',
    alternatePhone: '',
    contactEmail: '',
    officeAddress: '',
    latitude: '',
    longitude: '',
    primaryFocus: '',
    highlightedTowns: '',
    serviceRadius: '',
    businessHours: '',
    responseTime: '',
    emergencyAvailable: false,
    services: '',
    verifiedFiveStarTotal: 0,
    googleReviewsTotal: 0,
    reviewLinks: '',
    reviewNotes: '',
    yearsInBusiness: '',
    licensesCertifications: '',
    warrantyInfo: '',
    projectVolume: '',
    autoKeywords: '',
    badges: '',
    instagramUrl: '',
    facebookUrl: '',
    youtubeUrl: '',
    linkedinUrl: '',
    tiktokUrl: '',
    galleryLinks: '',
    pressLinks: '',
    beforeAfterImages: '',
    projectGallery: '',
    embeddedVideos: '',
    faqs: '',
    gbpVerificationStatus: '',
    dataGaps: '',
    metaTitle: '',
    metaDescription: '',
    structuredData: '',
    schemaElements: '',
    aiDiscoveryTier: 'Basic',
  });

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (intake) {
      setFormData({
        legalName: intake.legalName || '',
        displayName: intake.displayName || '',
        tagline: intake.tagline || '',
        industryCategory: intake.industryCategory || '',
        yearEstablished: intake.yearEstablished || '',
        ownerPrincipal: intake.ownerPrincipal || '',
        ownershipType: intake.ownershipType || '',
        verificationTier: intake.verificationTier || 'Basic',
        businessStatus: intake.businessStatus || 'Open',
        shortDescription: intake.shortDescription || '',
        officePhone: intake.officePhone || '',
        alternatePhone: intake.alternatePhone || '',
        contactEmail: intake.contactEmail || '',
        officeAddress: intake.officeAddress || '',
        latitude: intake.latitude?.toString() || '',
        longitude: intake.longitude?.toString() || '',
        primaryFocus: intake.primaryFocus || '',
        highlightedTowns: Array.isArray(intake.highlightedTowns) ? intake.highlightedTowns.join(', ') : '',
        serviceRadius: intake.serviceRadius || '',
        businessHours: intake.businessHours ? JSON.stringify(intake.businessHours, null, 2) : '',
        responseTime: intake.responseTime || '',
        emergencyAvailable: intake.emergencyAvailable || false,
        services: Array.isArray(intake.services) ? JSON.stringify(intake.services, null, 2) : '',
        verifiedFiveStarTotal: intake.verifiedFiveStarTotal || 0,
        googleReviewsTotal: intake.googleReviewsTotal || 0,
        reviewLinks: intake.reviewLinks ? JSON.stringify(intake.reviewLinks, null, 2) : '',
        reviewNotes: intake.reviewNotes || '',
        yearsInBusiness: intake.yearsInBusiness?.toString() || '',
        licensesCertifications: Array.isArray(intake.licensesCertifications) ? intake.licensesCertifications.join(', ') : '',
        warrantyInfo: intake.warrantyInfo || '',
        projectVolume: intake.projectVolume || '',
        autoKeywords: Array.isArray(intake.autoKeywords) ? intake.autoKeywords.join(', ') : '',
        badges: Array.isArray(intake.badges) ? intake.badges.join(', ') : '',
        instagramUrl: intake.instagramUrl || '',
        facebookUrl: intake.facebookUrl || '',
        youtubeUrl: intake.youtubeUrl || '',
        linkedinUrl: intake.linkedinUrl || '',
        tiktokUrl: intake.tiktokUrl || '',
        galleryLinks: Array.isArray(intake.galleryLinks) ? intake.galleryLinks.join(', ') : '',
        pressLinks: Array.isArray(intake.pressLinks) ? intake.pressLinks.join(', ') : '',
        beforeAfterImages: Array.isArray(intake.beforeAfterImages) ? intake.beforeAfterImages.join(', ') : '',
        projectGallery: Array.isArray(intake.projectGallery) ? intake.projectGallery.join(', ') : '',
        embeddedVideos: Array.isArray(intake.embeddedVideos) ? intake.embeddedVideos.join(', ') : '',
        faqs: Array.isArray(intake.faqs) ? JSON.stringify(intake.faqs, null, 2) : '',
        gbpVerificationStatus: intake.gbpVerificationStatus || '',
        dataGaps: intake.dataGaps || '',
        metaTitle: intake.metaTitle || '',
        metaDescription: intake.metaDescription || '',
        structuredData: intake.structuredData ? JSON.stringify(intake.structuredData, null, 2) : '',
        schemaElements: Array.isArray(intake.schemaElements) ? intake.schemaElements.join(', ') : '',
        aiDiscoveryTier: intake.aiDiscoveryTier || 'Basic',
      });
    }
  }, [intake]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const intakeData: any = {
        companyId: company.id,
        legalName: formData.legalName,
        displayName: formData.displayName,
        tagline: formData.tagline,
        industryCategory: formData.industryCategory,
        yearEstablished: formData.yearEstablished,
        ownerPrincipal: formData.ownerPrincipal,
        ownershipType: formData.ownershipType,
        verificationTier: formData.verificationTier,
        businessStatus: formData.businessStatus,
        shortDescription: formData.shortDescription,
        officePhone: formData.officePhone,
        alternatePhone: formData.alternatePhone,
        contactEmail: formData.contactEmail,
        officeAddress: formData.officeAddress,
        latitude: formData.latitude ? parseFloat(formData.latitude as string) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude as string) : null,
        primaryFocus: formData.primaryFocus,
        highlightedTowns: formData.highlightedTowns ? formData.highlightedTowns.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        serviceRadius: formData.serviceRadius,
        businessHours: formData.businessHours ? JSON.parse(formData.businessHours) : null,
        responseTime: formData.responseTime,
        emergencyAvailable: formData.emergencyAvailable,
        services: formData.services ? JSON.parse(formData.services) : [],
        verifiedFiveStarTotal: parseInt(formData.verifiedFiveStarTotal as any) || 0,
        googleReviewsTotal: parseInt(formData.googleReviewsTotal as any) || 0,
        reviewLinks: formData.reviewLinks ? JSON.parse(formData.reviewLinks) : null,
        reviewNotes: formData.reviewNotes,
        yearsInBusiness: formData.yearsInBusiness ? parseInt(formData.yearsInBusiness as string) : null,
        licensesCertifications: formData.licensesCertifications ? formData.licensesCertifications.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        warrantyInfo: formData.warrantyInfo,
        projectVolume: formData.projectVolume,
        autoKeywords: formData.autoKeywords ? formData.autoKeywords.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        badges: formData.badges ? formData.badges.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        instagramUrl: formData.instagramUrl,
        facebookUrl: formData.facebookUrl,
        youtubeUrl: formData.youtubeUrl,
        linkedinUrl: formData.linkedinUrl,
        tiktokUrl: formData.tiktokUrl,
        galleryLinks: formData.galleryLinks ? formData.galleryLinks.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        pressLinks: formData.pressLinks ? formData.pressLinks.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        beforeAfterImages: formData.beforeAfterImages ? formData.beforeAfterImages.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        projectGallery: formData.projectGallery ? formData.projectGallery.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        embeddedVideos: formData.embeddedVideos ? formData.embeddedVideos.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        faqs: formData.faqs ? JSON.parse(formData.faqs) : [],
        gbpVerificationStatus: formData.gbpVerificationStatus,
        dataGaps: formData.dataGaps,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        structuredData: formData.structuredData ? JSON.parse(formData.structuredData) : null,
        schemaElements: formData.schemaElements ? formData.schemaElements.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        aiDiscoveryTier: formData.aiDiscoveryTier,
      };

      await saveIntake(intakeData);
      alert('✅ Intake saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      alert('❌ Failed to save: ' + error.message);
    } finally {
      setIsSaving(false);
    }
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
        body: JSON.stringify({ document: pasteText }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse document');
      }

      const parsed = result.data;

      // Helper to convert "N/A" or empty strings to null for numbers
      const toNumber = (val: any) => {
        if (!val || val === 'N/A' || val === '' || val === 'null') return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      // Build the intake data object to save
      const intakeData: any = {
        companyId: company.id,
        legalName: parsed.legalName || '',
        displayName: parsed.displayName || '',
        tagline: parsed.tagline || '',
        industryCategory: parsed.industryCategory || '',
        yearEstablished: parsed.yearEstablished || '',
        ownerPrincipal: parsed.ownerPrincipal || '',
        ownershipType: parsed.ownershipType || '',
        verificationTier: parsed.verificationTier || 'Basic',
        businessStatus: parsed.businessStatus || 'Open',
        shortDescription: parsed.shortDescription || '',
        officePhone: parsed.officePhone || '',
        alternatePhone: parsed.alternatePhone || '',
        contactEmail: parsed.contactEmail || '',
        officeAddress: parsed.officeAddress || '',
        latitude: toNumber(parsed.latitude),
        longitude: toNumber(parsed.longitude),
        primaryFocus: parsed.primaryFocus || '',
        highlightedTowns: parsed.highlightedTowns || [],
        serviceRadius: parsed.serviceRadius || '',
        businessHours: parsed.businessHours || null,
        responseTime: parsed.responseTime || '',
        emergencyAvailable: parsed.emergencyAvailable || false,
        services: parsed.services || [],
        verifiedFiveStarTotal: toNumber(parsed.verifiedFiveStarTotal) || 0,
        googleReviewsTotal: toNumber(parsed.googleReviewsTotal) || 0,
        reviewLinks: parsed.reviewLinks || null,
        reviewNotes: parsed.reviewNotes || '',
        yearsInBusiness: toNumber(parsed.yearsInBusiness),
        licensesCertifications: parsed.licensesCertifications || [],
        warrantyInfo: parsed.warrantyInfo || '',
        projectVolume: parsed.projectVolume || '',
        autoKeywords: parsed.autoKeywords || [],
        badges: parsed.badges || [],
        instagramUrl: parsed.instagramUrl || '',
        facebookUrl: parsed.facebookUrl || '',
        youtubeUrl: parsed.youtubeUrl || '',
        linkedinUrl: parsed.linkedinUrl || '',
        tiktokUrl: parsed.tiktokUrl || '',
        galleryLinks: parsed.galleryLinks || [],
        pressLinks: parsed.pressLinks || [],
        beforeAfterImages: parsed.beforeAfterImages || [],
        projectGallery: parsed.projectGallery || [],
        embeddedVideos: parsed.embeddedVideos || [],
        faqs: parsed.faqs || [],
        gbpVerificationStatus: parsed.gbpVerificationStatus || '',
        dataGaps: parsed.dataGaps || '',
        metaTitle: parsed.metaTitle || '',
        metaDescription: parsed.metaDescription || '',
        structuredData: parsed.structuredData || null,
        schemaElements: parsed.schemaElements || [],
        aiDiscoveryTier: parsed.aiDiscoveryTier || 'Basic',
      };

      // SAVE IT IMMEDIATELY
      await saveIntake(intakeData);

      setShowPasteModal(false);
      setPasteText('');
      alert(`✅ SUCCESS!\n\nParsed and saved ${result.fieldsExtracted} fields.\n\nReloading page...`);
      
      // Reload the page to show the saved data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Parse error:', error);
      alert('❌ Failed to parse document:\n\n' + error.message);
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
              Paste intake document for AI auto-fill, or manually edit fields below
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowPasteModal(true)} variant="outline" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Paste Intake
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Intake
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {showPasteModal && (
        <Card className="p-6 border-2 border-blue-300">
          <h3 className="text-lg font-semibold mb-3">Paste Intake Document</h3>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="w-full h-64 p-3 border border-slate-300 rounded-lg text-sm font-mono"
            placeholder="Paste the entire intake document here (like the Kitzen Construction example)..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPasteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasteIntake} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Auto-Fill with AI'
              )}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
          Basic Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Legal Name</label>
            <input
              type="text"
              value={formData.legalName}
              onChange={(e) => handleFieldChange('legalName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Display Name (DBA)</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleFieldChange('displayName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Tagline/Slogan</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => handleFieldChange('tagline', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Industry/Category</label>
            <input
              type="text"
              value={formData.industryCategory}
              onChange={(e) => handleFieldChange('industryCategory', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Year Established</label>
            <input
              type="text"
              value={formData.yearEstablished}
              onChange={(e) => handleFieldChange('yearEstablished', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Owner/Principal</label>
            <input
              type="text"
              value={formData.ownerPrincipal}
              onChange={(e) => handleFieldChange('ownerPrincipal', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ownership Type</label>
            <input
              type="text"
              value={formData.ownershipType}
              onChange={(e) => handleFieldChange('ownershipType', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Verification Tier</label>
            <select
              value={formData.verificationTier}
              onChange={(e) => handleFieldChange('verificationTier', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="Basic">Basic</option>
              <option value="Verified">Verified</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Business Status</label>
            <input
              type="text"
              value={formData.businessStatus}
              onChange={(e) => handleFieldChange('businessStatus', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Short Description</label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          Contact & Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Office Phone</label>
            <input
              type="tel"
              value={formData.officePhone}
              onChange={(e) => handleFieldChange('officePhone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Alternate Phone</label>
            <input
              type="tel"
              value={formData.alternatePhone}
              onChange={(e) => handleFieldChange('alternatePhone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Contact Email</label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Office Address</label>
            <input
              type="text"
              value={formData.officeAddress}
              onChange={(e) => handleFieldChange('officeAddress', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Latitude</label>
            <input
              type="text"
              value={formData.latitude}
              onChange={(e) => handleFieldChange('latitude', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Longitude</label>
            <input
              type="text"
              value={formData.longitude}
              onChange={(e) => handleFieldChange('longitude', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
          Service Area / Coverage
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Primary Focus</label>
            <input
              type="text"
              value={formData.primaryFocus}
              onChange={(e) => handleFieldChange('primaryFocus', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Highlighted Towns (comma-separated)</label>
            <textarea
              value={formData.highlightedTowns}
              onChange={(e) => handleFieldChange('highlightedTowns', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Service Radius</label>
            <input
              type="text"
              value={formData.serviceRadius}
              onChange={(e) => handleFieldChange('serviceRadius', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
          Business Hours & Availability
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Business Hours (JSON format)</label>
            <textarea
              value={formData.businessHours}
              onChange={(e) => handleFieldChange('businessHours', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Response Time</label>
            <input
              type="text"
              value={formData.responseTime}
              onChange={(e) => handleFieldChange('responseTime', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.emergencyAvailable}
                onChange={(e) => handleFieldChange('emergencyAvailable', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-slate-700">Emergency/Same-Day Available</span>
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
          Services / Products Offered
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Services (JSON array format)</label>
          <textarea
            value={formData.services}
            onChange={(e) => handleFieldChange('services', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            rows={8}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
          Reviews & Reputation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">⭐ Verified 5-Star Total</label>
            <input
              type="number"
              value={formData.verifiedFiveStarTotal}
              onChange={(e) => handleFieldChange('verifiedFiveStarTotal', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Google Reviews Total</label>
            <input
              type="number"
              value={formData.googleReviewsTotal}
              onChange={(e) => handleFieldChange('googleReviewsTotal', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Review Links (JSON format)</label>
            <textarea
              value={formData.reviewLinks}
              onChange={(e) => handleFieldChange('reviewLinks', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              rows={3}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Review Notes</label>
            <textarea
              value={formData.reviewNotes}
              onChange={(e) => handleFieldChange('reviewNotes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
          Key Metrics & Badges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Years in Business</label>
            <input
              type="number"
              value={formData.yearsInBusiness}
              onChange={(e) => handleFieldChange('yearsInBusiness', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Project Volume</label>
            <input
              type="text"
              value={formData.projectVolume}
              onChange={(e) => handleFieldChange('projectVolume', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Licenses/Certifications (comma-separated)</label>
            <input
              type="text"
              value={formData.licensesCertifications}
              onChange={(e) => handleFieldChange('licensesCertifications', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Warranty/Guarantee Info</label>
            <textarea
              value={formData.warrantyInfo}
              onChange={(e) => handleFieldChange('warrantyInfo', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Auto Keywords (comma-separated)</label>
            <input
              type="text"
              value={formData.autoKeywords}
              onChange={(e) => handleFieldChange('autoKeywords', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Badges (comma-separated)</label>
            <input
              type="text"
              value={formData.badges}
              onChange={(e) => handleFieldChange('badges', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
          Social & Media Links
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Instagram URL</label>
            <input
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => handleFieldChange('instagramUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Facebook URL</label>
            <input
              type="url"
              value={formData.facebookUrl}
              onChange={(e) => handleFieldChange('facebookUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">YouTube URL</label>
            <input
              type="url"
              value={formData.youtubeUrl}
              onChange={(e) => handleFieldChange('youtubeUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => handleFieldChange('linkedinUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">TikTok URL</label>
            <input
              type="url"
              value={formData.tiktokUrl}
              onChange={(e) => handleFieldChange('tiktokUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Links (comma-separated URLs)</label>
            <input
              type="text"
              value={formData.galleryLinks}
              onChange={(e) => handleFieldChange('galleryLinks', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Press/Affiliation Links (comma-separated)</label>
            <input
              type="text"
              value={formData.pressLinks}
              onChange={(e) => handleFieldChange('pressLinks', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">9</span>
          Visual Gallery / Media
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Before/After Images (comma-separated URLs)</label>
            <textarea
              value={formData.beforeAfterImages}
              onChange={(e) => handleFieldChange('beforeAfterImages', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Project Gallery (comma-separated URLs)</label>
            <textarea
              value={formData.projectGallery}
              onChange={(e) => handleFieldChange('projectGallery', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Embedded Videos (comma-separated URLs)</label>
            <textarea
              value={formData.embeddedVideos}
              onChange={(e) => handleFieldChange('embeddedVideos', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">10</span>
          FAQs (SEO-Optimized)
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">FAQs (JSON array format)</label>
          <textarea
            value={formData.faqs}
            onChange={(e) => handleFieldChange('faqs', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            rows={8}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">11</span>
          Change Log / Confidence Notes
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">GBP Verification Status</label>
            <input
              type="text"
              value={formData.gbpVerificationStatus}
              onChange={(e) => handleFieldChange('gbpVerificationStatus', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Data Gaps/Assumptions</label>
            <textarea
              value={formData.dataGaps}
              onChange={(e) => handleFieldChange('dataGaps', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">12</span>
          SEO & Metadata Block
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Meta Title (≤60 chars)</label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => handleFieldChange('metaTitle', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              maxLength={60}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description (≤160 chars)</label>
            <textarea
              value={formData.metaDescription}
              onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={2}
              maxLength={160}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Structured Data (JSON-LD)</label>
            <textarea
              value={formData.structuredData}
              onChange={(e) => handleFieldChange('structuredData', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              rows={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Schema Elements (comma-separated)</label>
            <input
              type="text"
              value={formData.schemaElements}
              onChange={(e) => handleFieldChange('schemaElements', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI Discovery Tier</label>
            <select
              value={formData.aiDiscoveryTier}
              onChange={(e) => handleFieldChange('aiDiscoveryTier', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="Basic">Basic</option>
              <option value="Verified">Verified</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-slate-50 sticky bottom-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Review all fields then click Save Intake
          </p>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Intake
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}