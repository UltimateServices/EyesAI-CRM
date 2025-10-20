'use client';

import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Minus, 
  Save, 
  Bot,
  Search,
  Building2,
  Globe,
  MapPin,
  Clock,
  Star,
  Camera,
  Users,
  MessageSquare,
  Shield,
  Phone,
  Mail
} from 'lucide-react';
import { useState } from 'react';

interface IntakeFormProps {
  company: Company;
}

export function IntakeForm({ company }: IntakeFormProps) {
  // Initialize form state with ROMA-PDF structure
  const [formData, setFormData] = useState({
    // Section 1: Metadata
    category: '',
    
    // Section 2: AI Overview
    ai_overview_line: '',
    
    // Section 3: Hero Section
    logo_url: '',
    company_name: company.name,
    eyes_handle: `@${company.name.toLowerCase().replace(/\s+/g, '-')}`,
    descriptor_line: '',
    website: company.website || '',
    phone: company.phone || '',
    email: company.contactEmail || '',
    address: company.address || '',
    
    // Section 4: About & Badges
    ai_summary_120w: '',
    company_badges: [''],
    
    // Section 5: Services
    services: [
      {
        emoji: '',
        title: '',
        summary_1line: '',
        whats_included: [''],
        whats_not_included: [''],
        duration: '',
        pricing_label: '',
        learn_more_url: ''
      }
    ],
    
    // Section 6: Pricing Information
    pricing_summary: '',
    
    // Section 7: What to Expect (6 scenarios)
    what_to_expect: [
      {
        emoji: '',
        title: '',
        recommended_for: '',
        whats_involved: [''],
        pro_tip: ''
      }
    ],
    
    // Section 8: Locations & Hours
    locations: [
      {
        label: '',
        address_line1: '',
        city: '',
        state: '',
        zip: '',
        service_area_text: '',
        monday_open: '',
        monday_close: '',
        monday_status: 'Open',
        tuesday_open: '',
        tuesday_close: '',
        tuesday_status: 'Open',
        wednesday_open: '',
        wednesday_close: '',
        wednesday_status: 'Open',
        thursday_open: '',
        thursday_close: '',
        thursday_status: 'Open',
        friday_open: '',
        friday_close: '',
        friday_status: 'Open',
        saturday_open: '',
        saturday_close: '',
        saturday_status: 'Open',
        sunday_open: '',
        sunday_close: '',
        sunday_status: 'Closed',
        hours_note: ''
      }
    ],
    
    // Section 9: FAQs
    faq_categories: [
      {
        category: '',
        items: [
          { question: '', answer: '' }
        ]
      }
    ],
    whats_new_month: 'October 2025',
    whats_new_items: [
      { question: '', answer: '' }
    ],
    
    // Section 10: Featured Reviews
    featured_reviews: [
      {
        reviewer: '',
        stars: 5,
        date: '',
        excerpt: '',
        source: 'Google',
        url: ''
      }
    ],
    
    // Section 11: Photo Gallery
    photo_gallery: [
      { image_url: '', alt_text: '' },
      { image_url: '', alt_text: '' },
      { image_url: '', alt_text: '' },
      { image_url: '', alt_text: '' },
      { image_url: '', alt_text: '' },
      { image_url: '', alt_text: '' }
    ],
    
    // Section 12: Plan Type
    plan_type: 'discover',
    
    // Section 13: Footer Social
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    youtube_url: '',
    linkedin_url: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [searchingMissing, setSearchingMissing] = useState(false);

  // Helper functions for dynamic fields
  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, {
        emoji: '',
        title: '',
        summary_1line: '',
        whats_included: [''],
        whats_not_included: [''],
        duration: '',
        pricing_label: '',
        learn_more_url: ''
      }]
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const addWhatToExpectScenario = () => {
    setFormData(prev => ({
      ...prev,
      what_to_expect: [...prev.what_to_expect, {
        emoji: '',
        title: '',
        recommended_for: '',
        whats_involved: [''],
        pro_tip: ''
      }]
    }));
  };

  const addLocation = () => {
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, {
        label: '',
        address_line1: '',
        city: '',
        state: '',
        zip: '',
        service_area_text: '',
        monday_open: '',
        monday_close: '',
        monday_status: 'Open',
        tuesday_open: '',
        tuesday_close: '',
        tuesday_status: 'Open',
        wednesday_open: '',
        wednesday_close: '',
        wednesday_status: 'Open',
        thursday_open: '',
        thursday_close: '',
        thursday_status: 'Open',
        friday_open: '',
        friday_close: '',
        friday_status: 'Open',
        saturday_open: '',
        saturday_close: '',
        saturday_status: 'Open',
        sunday_open: '',
        sunday_close: '',
        sunday_status: 'Closed',
        hours_note: ''
      }]
    }));
  };

  const addFAQCategory = () => {
    setFormData(prev => ({
      ...prev,
      faq_categories: [...prev.faq_categories, {
        category: '',
        items: [{ question: '', answer: '' }]
      }]
    }));
  };

  const addFAQItem = (categoryIndex: number) => {
    setFormData(prev => ({
      ...prev,
      faq_categories: prev.faq_categories.map((cat, i) => 
        i === categoryIndex 
          ? { ...cat, items: [...cat.items, { question: '', answer: '' }] }
          : cat
      )
    }));
  };

  const addReview = () => {
    setFormData(prev => ({
      ...prev,
      featured_reviews: [...prev.featured_reviews, {
        reviewer: '',
        stars: 5,
        date: '',
        excerpt: '',
        source: 'Google',
        url: ''
      }]
    }));
  };

  const handleRunIntake = async () => {
    setIsProcessing(true);
    // This will use your existing AI prompt system but contextualized with current company
    try {
      const response = await fetch('/api/run-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          companyName: company.name,
          website: company.website
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Merge AI results with existing form data
        setFormData(prev => ({ ...prev, ...result.data }));
      }
    } catch (error) {
      console.error('Run Intake failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchMissing = async () => {
    setSearchingMissing(true);
    // This will use multi-source AI research for missing fields
    try {
      const response = await fetch('/api/search-missing-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          companyName: company.name,
          website: company.website,
          currentData: formData
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, ...result.foundData }));
      }
    } catch (error) {
      console.error('Search Missing failed:', error);
    } finally {
      setSearchingMissing(false);
    }
  };

  const handleSave = async () => {
    // Save intake data
    console.log('Saving intake data:', formData);
    // API call to save would go here
  };

  return (
    <div className="space-y-8">
      {/* Header with Action Buttons */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ROMA-PDF Intake</h1>
            <p className="text-slate-600">Complete business profile data collection for {company.name}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleRunIntake}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Bot className="w-4 h-4 mr-2" />
              {isProcessing ? 'Running...' : 'Run Intake'}
            </Button>
            <Button 
              onClick={handleSearchMissing}
              disabled={searchingMissing}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Search className="w-4 h-4 mr-2" />
              {searchingMissing ? 'Searching...' : 'Search for Missing'}
            </Button>
            <Button onClick={handleSave} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>
      </Card>

      {/* Section 1: Metadata & AI Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Business Category & AI Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="category">Business Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beauty Salon">Beauty Salon</SelectItem>
                <SelectItem value="Restaurant">Restaurant</SelectItem>
                <SelectItem value="Auto Repair">Auto Repair</SelectItem>
                <SelectItem value="Dental">Dental</SelectItem>
                <SelectItem value="Law Firm">Law Firm</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="ai_overview">AI Overview Line</Label>
          <Textarea 
            id="ai_overview"
            placeholder="One sentence summary for AI assistants and search..."
            value={formData.ai_overview_line}
            onChange={(e) => setFormData(prev => ({ ...prev, ai_overview_line: e.target.value }))}
            className="mt-1"
          />
        </div>
      </Card>

      {/* Section 2: Hero Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Hero Section & Contact Info
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input 
              id="logo_url"
              placeholder="https://example.com/logo.png"
              value={formData.logo_url}
              onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input 
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="eyes_handle">Eyes Handle</Label>
            <Input 
              id="eyes_handle"
              value={formData.eyes_handle}
              onChange={(e) => setFormData(prev => ({ ...prev, eyes_handle: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="descriptor_line">Tagline/Descriptor</Label>
            <Input 
              id="descriptor_line"
              placeholder="Short tagline or service description"
              value={formData.descriptor_line}
              onChange={(e) => setFormData(prev => ({ ...prev, descriptor_line: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="website">Website URL</Label>
            <Input 
              id="website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Main Address</Label>
            <Input 
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      {/* Section 3: About & Badges */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          About Section & Company Badges
        </h2>
        
        <div className="mb-6">
          <Label htmlFor="ai_summary">About Summary (120 words)</Label>
          <Textarea 
            id="ai_summary"
            placeholder="Comprehensive business overview, services, and what makes you unique..."
            value={formData.ai_summary_120w}
            onChange={(e) => setFormData(prev => ({ ...prev, ai_summary_120w: e.target.value }))}
            rows={4}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label>Company Quality Badges</Label>
          <div className="space-y-2 mt-2">
            {formData.company_badges.map((badge, index) => (
              <div key={index} className="flex gap-2">
                <Input 
                  placeholder={`Badge ${index + 1} (e.g., "Professional", "Licensed")`}
                  value={badge}
                  onChange={(e) => {
                    const newBadges = [...formData.company_badges];
                    newBadges[index] = e.target.value;
                    setFormData(prev => ({ ...prev, company_badges: newBadges }));
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const newBadges = formData.company_badges.filter((_, i) => i !== index);
                    setFormData(prev => ({ ...prev, company_badges: newBadges }));
                  }}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, company_badges: [...prev.company_badges, ''] }))}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Badge
            </Button>
          </div>
        </div>
      </Card>

      {/* Section 4: Services */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            Services (4-6 services)
          </h2>
          <Button onClick={addService} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>
        
        <div className="space-y-6">
          {formData.services.map((service, serviceIndex) => (
            <Card key={serviceIndex} className="p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-slate-900">Service {serviceIndex + 1}</h3>
                {formData.services.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeService(serviceIndex)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Emoji</Label>
                  <Input 
                    placeholder="🔧"
                    value={service.emoji}
                    onChange={(e) => {
                      const newServices = [...formData.services];
                      newServices[serviceIndex].emoji = e.target.value;
                      setFormData(prev => ({ ...prev, services: newServices }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Service Title</Label>
                  <Input 
                    placeholder="Service name"
                    value={service.title}
                    onChange={(e) => {
                      const newServices = [...formData.services];
                      newServices[serviceIndex].title = e.target.value;
                      setFormData(prev => ({ ...prev, services: newServices }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Duration</Label>
                  <Input 
                    placeholder="30-45 minutes"
                    value={service.duration}
                    onChange={(e) => {
                      const newServices = [...formData.services];
                      newServices[serviceIndex].duration = e.target.value;
                      setFormData(prev => ({ ...prev, services: newServices }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Pricing Label</Label>
                  <Input 
                    placeholder="$50-$100 or Starting at $50"
                    value={service.pricing_label}
                    onChange={(e) => {
                      const newServices = [...formData.services];
                      newServices[serviceIndex].pricing_label = e.target.value;
                      setFormData(prev => ({ ...prev, services: newServices }));
                    }}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <Label>Summary (1 line)</Label>
                <Textarea 
                  placeholder="Brief description of this service"
                  value={service.summary_1line}
                  onChange={(e) => {
                    const newServices = [...formData.services];
                    newServices[serviceIndex].summary_1line = e.target.value;
                    setFormData(prev => ({ ...prev, services: newServices }));
                  }}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>What's Included</Label>
                  <div className="space-y-2 mt-1">
                    {service.whats_included.map((item, itemIndex) => (
                      <Input 
                        key={itemIndex}
                        placeholder={`Included item ${itemIndex + 1}`}
                        value={item}
                        onChange={(e) => {
                          const newServices = [...formData.services];
                          newServices[serviceIndex].whats_included[itemIndex] = e.target.value;
                          setFormData(prev => ({ ...prev, services: newServices }));
                        }}
                      />
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newServices = [...formData.services];
                        newServices[serviceIndex].whats_included.push('');
                        setFormData(prev => ({ ...prev, services: newServices }));
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Included
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>What's NOT Included</Label>
                  <div className="space-y-2 mt-1">
                    {service.whats_not_included.map((item, itemIndex) => (
                      <Input 
                        key={itemIndex}
                        placeholder={`Not included item ${itemIndex + 1}`}
                        value={item}
                        onChange={(e) => {
                          const newServices = [...formData.services];
                          newServices[serviceIndex].whats_not_included[itemIndex] = e.target.value;
                          setFormData(prev => ({ ...prev, services: newServices }));
                        }}
                      />
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newServices = [...formData.services];
                        newServices[serviceIndex].whats_not_included.push('');
                        setFormData(prev => ({ ...prev, services: newServices }));
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Not Included
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Section 5: Pricing Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          💰 Pricing Information Summary
        </h2>
        
        <div>
          <Label htmlFor="pricing_summary">Pricing Summary</Label>
          <Textarea 
            id="pricing_summary"
            placeholder="E.g., Haircuts $65-$85. Color services $95-$250. Call (516) 431-2959 for custom quotes..."
            value={formData.pricing_summary}
            onChange={(e) => setFormData(prev => ({ ...prev, pricing_summary: e.target.value }))}
            rows={3}
            className="mt-1"
          />
        </div>
      </Card>

      {/* Section 6: What to Expect (6 scenarios) */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            What to Expect: Common Scenarios (6 cards)
          </h2>
          <Button onClick={addWhatToExpectScenario} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Scenario
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.what_to_expect.map((scenario, index) => (
            <Card key={index} className="p-4 border-l-4 border-green-500">
              <h3 className="font-medium text-slate-900 mb-4">Scenario {index + 1}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Emoji</Label>
                  <Input 
                    placeholder="📞"
                    value={scenario.emoji}
                    onChange={(e) => {
                      const newScenarios = [...formData.what_to_expect];
                      newScenarios[index].emoji = e.target.value;
                      setFormData(prev => ({ ...prev, what_to_expect: newScenarios }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Title</Label>
                  <Input 
                    placeholder="Initial Contact"
                    value={scenario.title}
                    onChange={(e) => {
                      const newScenarios = [...formData.what_to_expect];
                      newScenarios[index].title = e.target.value;
                      setFormData(prev => ({ ...prev, what_to_expect: newScenarios }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Recommended For</Label>
                  <Input 
                    placeholder="All new clients"
                    value={scenario.recommended_for}
                    onChange={(e) => {
                      const newScenarios = [...formData.what_to_expect];
                      newScenarios[index].recommended_for = e.target.value;
                      setFormData(prev => ({ ...prev, what_to_expect: newScenarios }));
                    }}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <Label>What's Involved</Label>
                <div className="space-y-2 mt-1">
                  {scenario.whats_involved.map((item, itemIndex) => (
                    <Input 
                      key={itemIndex}
                      placeholder={`Step ${itemIndex + 1}`}
                      value={item}
                      onChange={(e) => {
                        const newScenarios = [...formData.what_to_expect];
                        newScenarios[index].whats_involved[itemIndex] = e.target.value;
                        setFormData(prev => ({ ...prev, what_to_expect: newScenarios }));
                      }}
                    />
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newScenarios = [...formData.what_to_expect];
                      newScenarios[index].whats_involved.push('');
                      setFormData(prev => ({ ...prev, what_to_expect: newScenarios }));
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Step
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Pro Tip</Label>
                <Textarea 
                  placeholder="Helpful tip for customers..."
                  value={scenario.pro_tip}
                  onChange={(e) => {
                    const newScenarios = [...formData.what_to_expect];
                    newScenarios[index].pro_tip = e.target.value;
                    setFormData(prev => ({ ...prev, what_to_expect: newScenarios }));
                  }}
                  rows={2}
                />
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Section 7: Locations & Hours */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Locations & Hours
          </h2>
          <Button onClick={addLocation} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
        
        <div className="space-y-6">
          {formData.locations.map((location, locationIndex) => (
            <Card key={locationIndex} className="p-4 border-l-4 border-purple-500">
              <h3 className="font-medium text-slate-900 mb-4">Location {locationIndex + 1}</h3>
              
              {/* Address Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Location Label</Label>
                  <Input 
                    placeholder="📍 Main Location"
                    value={location.label}
                    onChange={(e) => {
                      const newLocations = [...formData.locations];
                      newLocations[locationIndex].label = e.target.value;
                      setFormData(prev => ({ ...prev, locations: newLocations }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Street Address</Label>
                  <Input 
                    placeholder="123 Main Street"
                    value={location.address_line1}
                    onChange={(e) => {
                      const newLocations = [...formData.locations];
                      newLocations[locationIndex].address_line1 = e.target.value;
                      setFormData(prev => ({ ...prev, locations: newLocations }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>City</Label>
                  <Input 
                    placeholder="Long Beach"
                    value={location.city}
                    onChange={(e) => {
                      const newLocations = [...formData.locations];
                      newLocations[locationIndex].city = e.target.value;
                      setFormData(prev => ({ ...prev, locations: newLocations }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>State</Label>
                  <Input 
                    placeholder="NY"
                    value={location.state}
                    onChange={(e) => {
                      const newLocations = [...formData.locations];
                      newLocations[locationIndex].state = e.target.value;
                      setFormData(prev => ({ ...prev, locations: newLocations }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>ZIP Code</Label>
                  <Input 
                    placeholder="11561"
                    value={location.zip}
                    onChange={(e) => {
                      const newLocations = [...formData.locations];
                      newLocations[locationIndex].zip = e.target.value;
                      setFormData(prev => ({ ...prev, locations: newLocations }));
                    }}
                  />
                </div>
              </div>
              
              {/* Service Area */}
              <div className="mb-6">
                <Label>Service Area Text</Label>
                <Textarea 
                  placeholder="Serving Long Beach, Oceanside, and surrounding Nassau County communities..."
                  value={location.service_area_text}
                  onChange={(e) => {
                    const newLocations = [...formData.locations];
                    newLocations[locationIndex].service_area_text = e.target.value;
                    setFormData(prev => ({ ...prev, locations: newLocations }));
                  }}
                  rows={2}
                />
              </div>
              
              {/* Hours of Operation */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Hours of Operation</h4>
                <div className="space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="grid grid-cols-4 gap-2 items-center">
                      <Label className="capitalize">{day}</Label>
                      <Select 
                        value={location[`${day}_status` as keyof typeof location] as string}
                        onValueChange={(value) => {
                          const newLocations = [...formData.locations];
                          (newLocations[locationIndex] as any)[`${day}_status`] = value;
                          setFormData(prev => ({ ...prev, locations: newLocations }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="9:00 AM"
                        value={location[`${day}_open` as keyof typeof location] as string}
                        onChange={(e) => {
                          const newLocations = [...formData.locations];
                          (newLocations[locationIndex] as any)[`${day}_open`] = e.target.value;
                          setFormData(prev => ({ ...prev, locations: newLocations }));
                        }}
                        disabled={location[`${day}_status` as keyof typeof location] === 'Closed'}
                      />
                      <Input 
                        placeholder="5:00 PM"
                        value={location[`${day}_close` as keyof typeof location] as string}
                        onChange={(e) => {
                          const newLocations = [...formData.locations];
                          (newLocations[locationIndex] as any)[`${day}_close`] = e.target.value;
                          setFormData(prev => ({ ...prev, locations: newLocations }));
                        }}
                        disabled={location[`${day}_status` as keyof typeof location] === 'Closed'}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Label>Hours Note</Label>
                  <Input 
                    placeholder="Holiday hours may vary"
                    value={location.hours_note}
                    onChange={(e) => {
                      const newLocations = [...formData.locations];
                      newLocations[locationIndex].hours_note = e.target.value;
                      setFormData(prev => ({ ...prev, locations: newLocations }));
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Section 8: FAQs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Frequently Asked Questions
          </h2>
          <Button onClick={addFAQCategory} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
        
        {/* All Questions */}
        <div className="mb-8">
          <h3 className="font-medium text-slate-900 mb-4">All Questions (5 Categories)</h3>
          <div className="space-y-4">
            {formData.faq_categories.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="p-4 border-l-4 border-yellow-500">
                <div className="mb-4">
                  <Label>Category Name</Label>
                  <Input 
                    placeholder="Appointments, Services, Pricing, etc."
                    value={category.category}
                    onChange={(e) => {
                      const newCategories = [...formData.faq_categories];
                      newCategories[categoryIndex].category = e.target.value;
                      setFormData(prev => ({ ...prev, faq_categories: newCategories }));
                    }}
                  />
                </div>
                
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="grid grid-cols-1 gap-2">
                      <Input 
                        placeholder="Question"
                        value={item.question}
                        onChange={(e) => {
                          const newCategories = [...formData.faq_categories];
                          newCategories[categoryIndex].items[itemIndex].question = e.target.value;
                          setFormData(prev => ({ ...prev, faq_categories: newCategories }));
                        }}
                      />
                      <Textarea 
                        placeholder="Answer"
                        value={item.answer}
                        onChange={(e) => {
                          const newCategories = [...formData.faq_categories];
                          newCategories[categoryIndex].items[itemIndex].answer = e.target.value;
                          setFormData(prev => ({ ...prev, faq_categories: newCategories }));
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addFAQItem(categoryIndex)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Q&A
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        {/* What's New */}
        <div>
          <h3 className="font-medium text-slate-900 mb-4">What's New? Monthly Updates</h3>
          <div className="mb-4">
            <Label>Month Label</Label>
            <Input 
              placeholder="October 2025"
              value={formData.whats_new_month}
              onChange={(e) => setFormData(prev => ({ ...prev, whats_new_month: e.target.value }))}
            />
          </div>
          
          <div className="space-y-3">
            {formData.whats_new_items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-2">
                <Input 
                  placeholder="Question"
                  value={item.question}
                  onChange={(e) => {
                    const newItems = [...formData.whats_new_items];
                    newItems[index].question = e.target.value;
                    setFormData(prev => ({ ...prev, whats_new_items: newItems }));
                  }}
                />
                <Textarea 
                  placeholder="Answer"
                  value={item.answer}
                  onChange={(e) => {
                    const newItems = [...formData.whats_new_items];
                    newItems[index].answer = e.target.value;
                    setFormData(prev => ({ ...prev, whats_new_items: newItems }));
                  }}
                  rows={2}
                />
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFormData(prev => ({ 
                ...prev, 
                whats_new_items: [...prev.whats_new_items, { question: '', answer: '' }] 
              }))}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Q&A
            </Button>
          </div>
        </div>
      </Card>

      {/* Section 9: Featured Reviews */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            Featured Reviews (3 reviews)
          </h2>
          <Button onClick={addReview} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Review
          </Button>
        </div>
        
        <div className="space-y-4">
          {formData.featured_reviews.map((review, index) => (
            <Card key={index} className="p-4 border-l-4 border-yellow-500">
              <h3 className="font-medium text-slate-900 mb-4">Review {index + 1}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Reviewer Name</Label>
                  <Input 
                    placeholder="Jennifer M."
                    value={review.reviewer}
                    onChange={(e) => {
                      const newReviews = [...formData.featured_reviews];
                      newReviews[index].reviewer = e.target.value;
                      setFormData(prev => ({ ...prev, featured_reviews: newReviews }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Star Rating</Label>
                  <Select 
                    value={review.stars.toString()}
                    onValueChange={(value) => {
                      const newReviews = [...formData.featured_reviews];
                      newReviews[index].stars = parseInt(value);
                      setFormData(prev => ({ ...prev, featured_reviews: newReviews }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Source</Label>
                  <Select 
                    value={review.source}
                    onValueChange={(value) => {
                      const newReviews = [...formData.featured_reviews];
                      newReviews[index].source = value;
                      setFormData(prev => ({ ...prev, featured_reviews: newReviews }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Yelp">Yelp</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input 
                    placeholder="September 2025"
                    value={review.date}
                    onChange={(e) => {
                      const newReviews = [...formData.featured_reviews];
                      newReviews[index].date = e.target.value;
                      setFormData(prev => ({ ...prev, featured_reviews: newReviews }));
                    }}
                  />
                </div>
                
                <div>
                  <Label>Review URL (optional)</Label>
                  <Input 
                    placeholder="https://..."
                    value={review.url}
                    onChange={(e) => {
                      const newReviews = [...formData.featured_reviews];
                      newReviews[index].url = e.target.value;
                      setFormData(prev => ({ ...prev, featured_reviews: newReviews }));
                    }}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label>Review Text</Label>
                <Textarea 
                  placeholder="Amazing experience! The team really listened to what I wanted..."
                  value={review.excerpt}
                  onChange={(e) => {
                    const newReviews = [...formData.featured_reviews];
                    newReviews[index].excerpt = e.target.value;
                    setFormData(prev => ({ ...prev, featured_reviews: newReviews }));
                  }}
                  rows={3}
                />
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Section 10: Photo Gallery */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Photo Gallery (6 images)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.photo_gallery.map((photo, index) => (
            <div key={index} className="space-y-2">
              <Label>Photo {index + 1}</Label>
              <Input 
                placeholder="Image URL"
                value={photo.image_url}
                onChange={(e) => {
                  const newPhotos = [...formData.photo_gallery];
                  newPhotos[index].image_url = e.target.value;
                  setFormData(prev => ({ ...prev, photo_gallery: newPhotos }));
                }}
              />
              <Input 
                placeholder="Alt text description"
                value={photo.alt_text}
                onChange={(e) => {
                  const newPhotos = [...formData.photo_gallery];
                  newPhotos[index].alt_text = e.target.value;
                  setFormData(prev => ({ ...prev, photo_gallery: newPhotos }));
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Section 11: Plan Type & Social */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Plan Type & Social Media
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Plan Type</Label>
            <Select 
              value={formData.plan_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, plan_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discover">Discover Package</SelectItem>
                <SelectItem value="verified">Verified Package</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <h3 className="font-medium text-slate-900 mb-4">Social Media Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Facebook URL</Label>
            <Input 
              placeholder="https://facebook.com/..."
              value={formData.facebook_url}
              onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
            />
          </div>
          
          <div>
            <Label>Instagram URL</Label>
            <Input 
              placeholder="https://instagram.com/..."
              value={formData.instagram_url}
              onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
            />
          </div>
          
          <div>
            <Label>TikTok URL</Label>
            <Input 
              placeholder="https://tiktok.com/@..."
              value={formData.tiktok_url}
              onChange={(e) => setFormData(prev => ({ ...prev, tiktok_url: e.target.value }))}
            />
          </div>
          
          <div>
            <Label>YouTube URL</Label>
            <Input 
              placeholder="https://youtube.com/..."
              value={formData.youtube_url}
              onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
            />
          </div>
          
          <div>
            <Label>LinkedIn URL</Label>
            <Input 
              placeholder="https://linkedin.com/company/..."
              value={formData.linkedin_url}
              onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <Card className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-slate-900">Ready to save?</h3>
            <p className="text-slate-600 text-sm">All data will be saved to generate the ROMA-PDF profile.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Complete Intake
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}