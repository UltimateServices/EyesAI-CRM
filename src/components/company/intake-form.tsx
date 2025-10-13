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
  Plus, 
  X,
  Building2,
  FileText,
  Wrench,
  Image,
  Globe,
  Search,
  Code,
  Sparkles,
  Loader2,
  SearchCheck,
  Upload,
  Video as VideoIcon,
  Trash2,
} from 'lucide-react';

interface IntakeFormProps {
  company: Company;
}

export function IntakeForm({ company }: IntakeFormProps) {
  const saveIntake = useStore((state) => state.saveIntake);
  const updateCompanyFromIntake = useStore((state) => state.updateCompanyFromIntake);
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  
  const existingIntake = getIntakeByCompanyId(company.id);

  const [activeTab, setActiveTab] = useState('company-info');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [enrichmentMetadata, setEnrichmentMetadata] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<Intake>>(existingIntake || {
    id: `intake-${company.id}`,
    companyId: company.id,
    status: 'draft',
    officialName: company.name,
    mainPhone: company.phone,
    physicalAddress: company.address,
    emails: company.contactEmail ? [company.contactEmail] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [services, setServices] = useState<Array<{ name: string; description: string; price?: string }>>(
    existingIntake?.services || [{ name: '', description: '', price: '' }]
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingVideos, setIsDraggingVideos] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    setServices([...services, { name: '', description: '', price: '' }]);
  };

  const updateService = (index: number, field: string, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
    updateField('services', updated.filter(s => s.name.trim() !== ''));
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        updateField('logoUrl', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        updateField('logoUrl', event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    updateField('logoUrl', '');
  };

  const handleImagesDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const currentUrls = formData.galleryImages || [];
        updateField('galleryImages', [...currentUrls, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const currentUrls = formData.galleryImages || [];
        updateField('galleryImages', [...currentUrls, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const currentUrls = formData.galleryImages || [];
    updateField('galleryImages', currentUrls.filter((_, i) => i !== index));
  };

  const handleVideosDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVideos(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    
    const videoUrls = files.map(f => URL.createObjectURL(f));
    updateField('videoLinks', [...(formData.videoLinks || []), ...videoUrls]);
  };

  const handleVideosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('video/'));
    
    const videoUrls = files.map(f => URL.createObjectURL(f));
    updateField('videoLinks', [...(formData.videoLinks || []), ...videoUrls]);
  };

  const removeVideo = (index: number) => {
    const currentUrls = formData.videoLinks || [];
    updateField('videoLinks', currentUrls.filter((_, i) => i !== index));
  };

  const autoEnrich = async () => {
    setIsEnriching(true);
    try {
      console.log('Starting smart enrichment...');
      
      const response = await fetch('/api/enrich-company-dual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: company.website,
          companyName: company.name,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        console.log('Enrichment successful:', result.data);
        
        setFormData(prev => ({
          ...prev,
          ...result.data,
        }));

        if (result.data.services && result.data.services.length > 0) {
          setServices(result.data.services);
        }

        setEnrichmentMetadata(result.metadata);

        const confidence = result.metadata?.overallConfidence || 0;
        alert(`✅ Auto-enrichment complete!\n\nConfidence: ${confidence}%\nHigh confidence: ${result.metadata?.highConfidenceFields || 0} fields\n\nClick "Fill Missing" if needed, then review and mark complete.`);
      } else {
        throw new Error(result.error || 'Enrichment failed');
      }
    } catch (error: any) {
      console.error('Enrichment error:', error);
      alert('❌ Enrichment failed: ' + error.message);
    } finally {
      setIsEnriching(false);
    }
  };

  const fillMissing = async () => {
    setIsFilling(true);
    try {
      console.log('Filling missing fields...');
      
      const missingFields: string[] = [];
      const checkFields = [
        'mainPhone', 'emails', 'physicalAddress', 'businessHours', 
        'category', 'founded', 'licenses', 'serviceAreas', 'shortBlurb',
        'fullAbout', 'missionStatement'
      ];
      
      checkFields.forEach(field => {
        const value = formData[field as keyof typeof formData];
        if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
          missingFields.push(field);
        }
      });

      if (missingFields.length === 0) {
        alert('✅ No missing fields! All data is filled in.');
        return;
      }

      const response = await fetch('/api/enrich-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.name,
          website: company.website,
          existingData: formData,
          missingFields,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        console.log('Missing fields filled:', result.data);
        
        setFormData(prev => ({
          ...prev,
          ...result.data,
        }));

        alert(`✅ Filled ${missingFields.length} missing fields!\n\nReview the data and make corrections as needed.`);
      } else {
        throw new Error(result.error || 'Fill missing failed');
      }
    } catch (error: any) {
      console.error('Fill missing error:', error);
      alert('❌ Fill missing failed: ' + error.message);
    } finally {
      setIsFilling(false);
    }
  };

  const saveDraft = () => {
    const intakeData: Intake = {
      ...formData,
      id: formData.id || `intake-${company.id}`,
      companyId: company.id,
      status: 'draft',
      services: services.filter(s => s.name.trim() !== ''),
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
      completedBy: 'John VA',
      services: services.filter(s => s.name.trim() !== ''),
      updatedAt: new Date().toISOString(),
    } as Intake;

    saveIntake(intakeData);
    updateCompanyFromIntake(company.id, intakeData);
    
    alert('✅ Intake marked complete!\n\nCompany status changed to ACTIVE.\nData is now saved and visible in Overview.');
    window.location.reload();
  };

  const tabs = [
    { id: 'company-info', label: 'Company Info', icon: Building2 },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'about', label: 'About', icon: FileText },
    { id: 'online', label: 'Online Presence', icon: Globe },
    { id: 'seo', label: 'SEO & Meta', icon: Search },
    { id: 'technical', label: 'Technical', icon: Code },
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
                1) Click "Smart Auto-Enrich" to scan website. 2) Click "Fill Missing" for gaps. 3) Review & mark complete.
              </p>
              {enrichmentMetadata && (
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-700 font-medium">
                    Confidence: {enrichmentMetadata.overallConfidence}%
                  </span>
                  <span className="text-blue-700">
                    High: {enrichmentMetadata.highConfidenceFields} fields
                  </span>
                  <span className="text-amber-700">
                    Medium: {enrichmentMetadata.mediumConfidenceFields} fields
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={autoEnrich}
              disabled={isEnriching || isFilling}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="sm"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enriching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Smart Auto-Enrich
                </>
              )}
            </Button>

            <Button
              onClick={fillMissing}
              disabled={isEnriching || isFilling}
              variant="outline"
              className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
              size="sm"
            >
              {isFilling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Filling...
                </>
              ) : (
                <>
                  <SearchCheck className="w-4 h-4" />
                  Fill Missing
                </>
              )}
            </Button>
            
            <Badge variant="secondary" className={formData.status === 'complete' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
              {formData.status === 'complete' ? 'Complete' : 'In Progress'}
            </Badge>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1">
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

        <TabsContent value="company-info" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Company Identity</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Official Business Name *
                </label>
                <input
                  type="text"
                  value={formData.officialName || ''}
                  onChange={(e) => updateField('officialName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Major Dumpsters LLC"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Category / Industry *
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Dumpster Rental / Waste Services"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Founded / Years in Business
                </label>
                <input
                  type="text"
                  value={formData.founded || ''}
                  onChange={(e) => updateField('founded', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="2023"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Hours
                </label>
                <input
                  type="text"
                  value={formData.businessHours || ''}
                  onChange={(e) => updateField('businessHours', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Mon-Fri 8am-5pm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  License # / Certifications
                </label>
                <input
                  type="text"
                  value={formData.licenses || ''}
                  onChange={(e) => updateField('licenses', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="NY DEC Hauler Permit #1234"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Contact & Location</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Main Phone *
                </label>
                <input
                  type="tel"
                  value={formData.mainPhone || ''}
                  onChange={(e) => updateField('mainPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="888-555-5555"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.emails?.[0] || ''}
                  onChange={(e) => updateField('emails', [e.target.value])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="info@company.com"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Physical Address *
                </label>
                <input
                  type="text"
                  value={formData.physicalAddress || ''}
                  onChange={(e) => updateField('physicalAddress', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="123 Main St, Oceanside NY 11572"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service Areas (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.serviceAreas?.join(', ') || ''}
                  onChange={(e) => updateField('serviceAreas', e.target.value.split(',').map(s => s.trim()))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Nassau County, Brooklyn, Queens"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Google Maps Link
                </label>
                <input
                  type="url"
                  value={formData.mapLink || ''}
                  onChange={(e) => updateField('mapLink', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4 mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900">Services Offered</h4>
              <Button onClick={addService} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Service
              </Button>
            </div>

            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Service name"
                    />
                    <input
                      type="text"
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      className="col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Brief description"
                    />
                  </div>
                  {services.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-6">Media Assets</h4>
            
            {/* Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Logo
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                onDragLeave={() => setIsDraggingLogo(false)}
                onDrop={handleLogoDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDraggingLogo 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {formData.logoUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={formData.logoUrl} alt="Logo" className="w-32 h-32 object-contain" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeLogo}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-2">
                      Drag & drop logo here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG, SVG up to 5MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Gallery Images Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Gallery Images
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingImages(true); }}
                onDragLeave={() => setIsDraggingImages(false)}
                onDrop={handleImagesDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDraggingImages 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {(formData.galleryImages && formData.galleryImages.length > 0) ? (
                  <div className="grid grid-cols-4 gap-4">
                    {formData.galleryImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={imageUrl} 
                          alt={`Image ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImagesSelect}
                        className="hidden"
                        id="images-upload"
                      />
                      <label htmlFor="images-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Plus className="w-4 h-4 mr-2" />
                            Add More
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <Image className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-2">
                      Drag & drop images here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500">Multiple images accepted (PNG, JPG)</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesSelect}
                      className="hidden"
                      id="images-upload-initial"
                    />
                    <label htmlFor="images-upload-initial">
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Videos Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Videos
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingVideos(true); }}
                onDragLeave={() => setIsDraggingVideos(false)}
                onDrop={handleVideosDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDraggingVideos 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {(formData.videoLinks && formData.videoLinks.length > 0) ? (
                  <div className="space-y-3">
                    {formData.videoLinks.map((videoUrl, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <VideoIcon className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-slate-900">Video {index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVideo(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideosSelect}
                      className="hidden"
                      id="videos-upload"
                    />
                    <label htmlFor="videos-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Plus className="w-4 h-4 mr-2" />
                          Add More Videos
                        </span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <>
                    <VideoIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-2">
                      Drag & drop videos here, or click to browse
                    </p>
                    <p className="text-xs text-slate-500">MP4, MOV, AVI up to 100MB</p>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={handleVideosSelect}
                      className="hidden"
                      id="videos-upload-initial"
                    />
                    <label htmlFor="videos-upload-initial">
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">About & Description</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Short Blurb (1-2 sentences)
                </label>
                <textarea
                  value={formData.shortBlurb || ''}
                  onChange={(e) => updateField('shortBlurb', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={2}
                  placeholder="Affordable roll-off dumpsters for home and contractors."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full About (from /about page)
                </label>
                <textarea
                  value={formData.fullAbout || ''}
                  onChange={(e) => updateField('fullAbout', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={6}
                  placeholder="Full about text automatically extracted from about page..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mission Statement / Tagline
                </label>
                <input
                  type="text"
                  value={formData.missionStatement || ''}
                  onChange={(e) => updateField('missionStatement', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Fast, Reliable, Affordable."
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="online" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Social Profiles</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  value={formData.socialProfiles?.facebook || ''}
                  onChange={(e) => updateField('socialProfiles', { ...formData.socialProfiles, facebook: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://facebook.com/company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.socialProfiles?.instagram || ''}
                  onChange={(e) => updateField('socialProfiles', { ...formData.socialProfiles, instagram: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://instagram.com/company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={formData.socialProfiles?.linkedin || ''}
                  onChange={(e) => updateField('socialProfiles', { ...formData.socialProfiles, linkedin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://linkedin.com/company/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Twitter/X
                </label>
                <input
                  type="url"
                  value={formData.socialProfiles?.twitter || ''}
                  onChange={(e) => updateField('socialProfiles', { ...formData.socialProfiles, twitter: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://x.com/company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  YouTube
                </label>
                <input
                  type="url"
                  value={formData.socialProfiles?.youtube || ''}
                  onChange={(e) => updateField('socialProfiles', { ...formData.socialProfiles, youtube: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://youtube.com/@company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  TikTok
                </label>
                <input
                  type="url"
                  value={formData.socialProfiles?.tiktok || ''}
                  onChange={(e) => updateField('socialProfiles', { ...formData.socialProfiles, tiktok: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="https://tiktok.com/@company"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Directory Verification</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.directories?.googleBusinessFound || false}
                  onChange={(e) => updateField('directories', { ...formData.directories, googleBusinessFound: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">Google Business Profile Found</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.directories?.yelpFound || false}
                  onChange={(e) => updateField('directories', { ...formData.directories, yelpFound: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">Yelp Listing Found</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.directories?.bbbFound || false}
                  onChange={(e) => updateField('directories', { ...formData.directories, bbbFound: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">BBB Listing Found</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.directories?.linkedinFound || false}
                  onChange={(e) => updateField('directories', { ...formData.directories, linkedinFound: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">LinkedIn Company Page Found</span>
              </label>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">SEO & Meta Data</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle || ''}
                  onChange={(e) => updateField('metaTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Page title from website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.metaDescription || ''}
                  onChange={(e) => updateField('metaDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={2}
                  placeholder="Meta description from website"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  H1 Tag
                </label>
                <input
                  type="text"
                  value={formData.h1Tag || ''}
                  onChange={(e) => updateField('h1Tag', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Main H1 heading"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Schema / Structured Data</h4>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.schemaDetected || false}
                  onChange={(e) => updateField('schemaDetected', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">Schema Markup Detected</span>
              </label>

              {formData.schemaDetected && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Schema Type
                  </label>
                  <input
                    type="text"
                    value={formData.schemaType || ''}
                    onChange={(e) => updateField('schemaType', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="LocalBusiness, Organization, etc."
                  />
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4 mt-4">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Technical Snapshot</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CMS / Platform
                </label>
                <input
                  type="text"
                  value={formData.platform || ''}
                  onChange={(e) => updateField('platform', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="WordPress, Webflow, Wix"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.sslEnabled || false}
                    onChange={(e) => updateField('sslEnabled', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">SSL Enabled (HTTPS)</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.mobileFriendly || false}
                    onChange={(e) => updateField('mobileFriendly', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-700">Mobile-Friendly</span>
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">VA Notes</h4>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              rows={6}
              placeholder="Any additional notes, observations, or issues encountered during intake..."
            />
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div className="text-sm text-slate-600">
          {isEnriching || isFilling
            ? '🔍 Processing...' 
            : 'Auto-enrich → Fill missing → Review → Mark complete'}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={saveDraft} className="gap-2" disabled={isEnriching || isFilling}>
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button onClick={markComplete} className="gap-2 bg-green-600 hover:bg-green-700" disabled={isEnriching || isFilling}>
            <CheckCircle className="w-4 h-4" />
            Mark Complete
          </Button>
        </div>
      </div>
    </div>
  );
}