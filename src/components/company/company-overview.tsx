'use client';

import { Company, Intake } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText,
  Phone,
  Globe,
  Mail,
  MapPin,
  Clock,
  Star,
  Camera,
  CheckCircle
} from 'lucide-react';

interface CompanyOverviewProps {
  company: Company;
  intake?: Intake | null;
}

export function CompanyOverview({ company, intake }: CompanyOverviewProps) {
  // If no intake, show placeholder
  if (!intake || !intake.romaData) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <FileText className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-3">No Intake Data Available</h3>
          <p className="text-slate-600 text-lg mb-2">
            Complete the intake form to see detailed company information here.
          </p>
          <p className="text-slate-500 text-sm">
            Go to the <strong>Intake</strong> tab to add company details and data.
          </p>
        </div>
      </Card>
    );
  }

  const data = intake.romaData;

  // Helper function to check if field is missing
  const isMissing = (value: any): boolean => {
    if (value === null || value === undefined || value === '' || value === '<>') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  };

  // Helper for red background class
  const getMissingClass = (value: any): string => {
    return isMissing(value) ? 'bg-red-50 border-red-300' : '';
  };

  return (
    <div className="space-y-6">
      {/* AI Summary Bar */}
      <Card className={`p-4 ${getMissingClass(data.ai_overview?.overview_line)} border-2`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div className="flex-1">
            <strong className="text-slate-900">AI Summary:</strong>{' '}
            <span className="text-slate-800">
              {data.ai_overview?.overview_line || 'Missing AI overview'}
            </span>
          </div>
        </div>
      </Card>

      {/* Hero Section */}
      <Card className="p-6">
        <div className="flex items-start gap-6 mb-6">
          {/* Logo */}
          <div className={`w-24 h-24 rounded-lg flex items-center justify-center text-white text-3xl font-bold ${getMissingClass(data.hero?.hero_image_url)} border-2`}>
            {data.hero?.hero_image_url && data.hero.hero_image_url !== '<>' ? (
              <img src={data.hero.hero_image_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full rounded-lg flex items-center justify-center">
                {data.hero?.business_name?.charAt(0) || 'C'}
              </div>
            )}
          </div>

          {/* Business Info */}
          <div className="flex-1">
            <h1 className={`text-3xl font-bold text-slate-900 mb-1 ${getMissingClass(data.hero?.business_name)} p-2 rounded`}>
              {data.hero?.business_name || 'Missing Business Name'}
            </h1>
            <p className={`text-blue-600 font-medium text-sm mb-2 ${getMissingClass(data.hero?.business_name)} p-2 rounded`}>
              @{data.slug || 'missing-handle'}
            </p>
            <p className={`text-slate-700 text-lg ${getMissingClass(data.hero?.tagline)} p-2 rounded`}>
              {data.hero?.tagline || 'Missing tagline'}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button className="bg-blue-600 hover:bg-blue-700" disabled={isMissing(data.hero?.quick_actions?.call_tel)}>
            <Phone className="w-4 h-4 mr-2" />
            Call Now
          </Button>
          <Button variant="outline" disabled={isMissing(data.hero?.quick_actions?.website_url)}>
            <Globe className="w-4 h-4 mr-2" />
            Visit Website
          </Button>
          <Button variant="outline" disabled={isMissing(data.hero?.quick_actions?.email_mailto)}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" disabled={isMissing(data.hero?.quick_actions?.maps_link)}>
            <MapPin className="w-4 h-4 mr-2" />
            Directions
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {data.hero?.badges?.map((badge: string, index: number) => (
            <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              {badge}
            </Badge>
          )) || <Badge variant="secondary" className="bg-red-100 text-red-800">No badges</Badge>}
        </div>
      </Card>

      {/* About Section */}
      <Card className={`p-6 ${getMissingClass(data.about_and_badges?.ai_summary_120w)} border-2`}>
        <h2 className="text-xl font-bold mb-4">About {data.hero?.business_name || company.name}</h2>
        <div className="border-l-4 border-orange-500 pl-6 mb-6">
          <p className="text-slate-700 leading-relaxed">
            {data.about_and_badges?.ai_summary_120w || 'Missing about summary'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {data.about_and_badges?.company_badges?.map((badge: string, index: number) => (
            <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 px-3 py-1">
              {badge}
            </Badge>
          )) || <Badge variant="outline" className="bg-red-50 text-red-700">No company badges</Badge>}
        </div>
      </Card>

      {/* Services Section */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">
          {data.services_section_title || 'Our Services'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.services && data.services.length > 0 ? (
            data.services.map((service: any, index: number) => (
              <div key={index} className="border border-slate-200 rounded-lg p-5 hover:shadow-lg transition-shadow relative">
                <Badge className="absolute top-4 right-4 bg-blue-600 text-white">
                  {service.pricing_label || 'Price not set'}
                </Badge>
                
                <div className="flex items-center gap-3 mb-4 pr-24">
                  <span className="text-3xl">{service.emoji || '📦'}</span>
                  <h3 className="font-bold text-slate-900 text-lg">{service.title || 'Untitled Service'}</h3>
                </div>
                
                <p className="text-slate-600 mb-4">{service.summary_1line || 'No description'}</p>
                
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">What's Included:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {service.whats_included?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    )) || <li className="text-red-600">No items listed</li>}
                  </ul>
                </div>
                
                <div className="flex items-center text-sm text-slate-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {service.duration || 'Duration not specified'}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 p-8 bg-red-50 border-2 border-red-300 rounded-lg text-center">
              <p className="text-red-800 font-medium">No services data available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Reference Guide */}
      {data.quick_reference_guide && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Quick Reference Guide</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {data.quick_reference_guide.columns?.map((col: string, index: number) => (
                    <th key={index} className="border border-slate-300 p-3 text-left font-semibold text-slate-800">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.quick_reference_guide.rows?.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-slate-50">
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="border border-slate-300 p-3 text-slate-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pricing Information */}
      <Card className={`p-6 bg-orange-50 border-2 ${getMissingClass(data.pricing_information?.summary_line)}`}>
        <div className="flex items-start gap-4">
          <div className="text-3xl">💰</div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-orange-900 mb-4">Pricing Information</h2>
            <p className="text-orange-800 mb-6">
              {data.pricing_information?.summary_line || 'Missing pricing information'}
            </p>
            <div className="flex gap-3">
              {data.pricing_information?.cta_buttons?.map((button: string, index: number) => (
                <Button key={index} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {button}
                </Button>
              )) || <Button disabled>No CTA buttons</Button>}
            </div>
          </div>
        </div>
      </Card>

      {/* What to Expect - 6 Cards */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">What to Expect: Common Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.what_to_expect && data.what_to_expect.length > 0 ? (
            data.what_to_expect.map((step: any, index: number) => (
              <div key={index} className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{step.emoji || '📋'}</span>
                  <h3 className="font-bold text-slate-900">{step.title || 'Untitled'}</h3>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-blue-600 font-medium">
                    <strong>Recommended:</strong> {step.recommended_for || 'Not specified'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">What's Involved:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {step.whats_involved?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">💡 Pro Tip:</span> {step.pro_tip || 'No tip provided'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 p-8 bg-red-50 border-2 border-red-300 rounded-lg text-center">
              <p className="text-red-800 font-medium">No "What to Expect" data available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Location & Hours */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Location(s)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Location Info */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">📍 Primary Location</h3>
            <div className={`text-slate-700 space-y-2 mb-4 p-3 rounded ${getMissingClass(data.locations_and_hours?.primary_location?.address_line1)}`}>
              <p className="font-medium">{data.locations_and_hours?.primary_location?.address_line1 || 'Missing address'}</p>
              <p>{data.locations_and_hours?.primary_location?.city_state_zip || 'Missing city/state'}</p>
              <Button variant="link" className="p-0 h-auto text-blue-600" disabled={isMissing(data.locations_and_hours?.primary_location?.google_maps_embed_url)}>
                <MapPin className="w-4 h-4 mr-1" />
                Get Directions →
              </Button>
            </div>
            
            <div className={`bg-blue-50 rounded-lg p-4 ${getMissingClass(data.locations_and_hours?.service_area_text)}`}>
              <h4 className="font-semibold text-slate-900 mb-2">Service Area</h4>
              <p className="text-slate-700 text-sm">
                {data.locations_and_hours?.service_area_text || 'Service area not specified'}
              </p>
            </div>
          </div>
          
          {/* Hours */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Hours of Operation</h3>
            <div className="space-y-3">
              {data.locations_and_hours?.opening_hours ? (
                Object.entries(data.locations_and_hours.opening_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-700 capitalize">{day}</span>
                    <span className="text-slate-900 font-medium">{hours || 'Closed'}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                  <p className="text-red-800">Hours not available</p>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-4 italic">
              {data.locations_and_hours?.hours_note || ''}
            </p>
          </div>
        </div>
      </Card>

      {/* FAQs */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">❓ Frequently Asked Questions</h2>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">All Questions</TabsTrigger>
            <TabsTrigger value="new">What's New?</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-6">
            {data.faqs?.all_questions ? (
              Object.entries(data.faqs.all_questions).map(([category, questions]: [string, any]) => (
                <div key={category}>
                  <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">
                    {category.replace(/_/g, ' ')}
                  </h3>
                  <div className="space-y-4">
                    {questions.map((faq: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-blue-300 pl-4">
                        <p className="font-semibold text-slate-900 mb-2">{faq.question}</p>
                        <p className="text-slate-700">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 bg-red-50 border-2 border-red-300 rounded-lg text-center">
                <p className="text-red-800 font-medium">No FAQs available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="new">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4 text-lg">
                {data.faqs?.whats_new?.month_label || 'Recent Updates'}
              </h3>
              <div className="space-y-4">
                {data.faqs?.whats_new?.questions?.map((item: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-400 pl-4">
                    <p className="font-semibold text-blue-900 mb-2">{item.question}</p>
                    <p className="text-blue-800">{item.answer}</p>
                  </div>
                )) || <p className="text-blue-800">No recent updates</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Featured Reviews */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Featured Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((index) => {
            const review = data.featured_reviews?.items?.[index];
            const missing = !review || isMissing(review.reviewer);
            
            return (
              <div key={index} className={`border rounded-lg p-5 shadow-sm ${missing ? 'bg-red-50 border-red-300 border-2' : 'border-slate-200'}`}>
                {review && !missing ? (
                  <>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(review.stars || 5)].map((_, idx) => (
                        <Star key={idx} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 leading-relaxed italic">"{review.excerpt}"</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900">- {review.reviewer}</span>
                      <span className="text-slate-500">{review.source}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{review.date}</p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-red-800 font-medium">Review {index + 1} missing</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Photo Gallery */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Photo Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const image = data.photo_gallery?.images?.[index];
            const missing = !image || isMissing(image.image_url);
            
            return (
              <div key={index} className={`aspect-square rounded-lg flex items-center justify-center border-2 ${missing ? 'bg-red-50 border-red-300' : 'bg-slate-100 border-slate-200'}`}>
                {image && !missing && image.image_url !== '<>' ? (
                  <img src={image.image_url} alt={image.alt || `Photo ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="text-center text-slate-500">
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs font-medium">Photo {index + 1}</p>
                    {missing && <p className="text-xs text-red-600">Missing</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-slate-600 text-center italic">
          {data.photo_gallery?.note || 'Additional activities detailed in Monthly Report'}
        </p>
      </Card>

      {/* Monthly Activity - 2 Cards */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Monthly Activity Section</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Discover Package */}
          <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 mb-4">Discover Package</Badge>
            <div className="space-y-3">
              {data.eyes_ai_monthly_activity?.discover?.map((item: string, index: number) => (
                <div key={index} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              )) || <p className="text-red-600">No discover activities listed</p>}
            </div>
          </div>
          
          {/* Verified Package */}
          <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
            <Badge variant="outline" className="bg-orange-100 text-orange-800 mb-4">Verified Package</Badge>
            <div className="space-y-3">
              {data.eyes_ai_monthly_activity?.verified?.map((item: string, index: number) => (
                <div key={index} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              )) || <p className="text-red-600">No verified activities listed</p>}
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-6 text-center italic bg-slate-100 rounded-lg p-3">
          {data.eyes_ai_monthly_activity?.note || 'Additional details in your Monthly Report'}
        </p>
      </Card>

      {/* Get In Touch */}
      <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h2 className="text-2xl font-bold mb-2 text-center">
          Get in Touch with {data.get_in_touch?.company_name || company.name}
        </h2>
        <p className="text-center mb-6 text-blue-100 text-lg">
          {data.get_in_touch?.city_state || 'Location not specified'}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          {data.get_in_touch?.buttons?.map((button: string, index: number) => (
            <Button key={index} size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
              {button}
            </Button>
          )) || <Button disabled>No contact buttons</Button>}
        </div>
        
        <p className="text-center text-blue-100 text-sm">
          {data.get_in_touch?.tagline || 'Eyes AI connects you directly to the business. No middleman, no fees.'}
        </p>
      </Card>

      {/* Footer */}
      <Card className="p-6 bg-slate-900 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-3">{data.footer?.company || company.name}</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p className={`flex items-center gap-2 p-2 rounded ${getMissingClass(data.footer?.phone_e164)}`}>
                <Phone className="w-4 h-4" />
                {data.footer?.phone_e164 || 'Phone missing'}
              </p>
              <p className={`flex items-center gap-2 p-2 rounded ${getMissingClass(data.footer?.email)}`}>
                <Mail className="w-4 h-4" />
                {data.footer?.email || 'Email missing'}
              </p>
              <p className={`flex items-center gap-2 p-2 rounded ${getMissingClass(data.footer?.website)}`}>
                <Globe className="w-4 h-4" />
                {data.footer?.website || 'Website missing'}
              </p>
            </div>
          </div>
          
          {/* Visit Us */}
          <div>
            <h4 className="font-semibold mb-3">Visit Us</h4>
            <p className={`text-sm text-slate-300 mb-3 p-2 rounded ${getMissingClass(data.footer?.visit_us_address)}`}>
              {data.footer?.visit_us_address || 'Address missing'}
            </p>
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800" disabled={isMissing(data.footer?.get_directions_url)}>
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
          </div>
          
          {/* Hours */}
          <div>
            <h4 className="font-semibold mb-3">Hours</h4>
            <p className={`text-sm text-slate-300 p-2 rounded ${getMissingClass(data.footer?.hours_recap)}`}>
              {data.footer?.hours_recap || 'Hours not specified'}
            </p>
            
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-sm">Follow Us</h4>
              <div className="flex gap-2">
                {data.footer?.social && Object.keys(data.footer.social).length > 0 ? (
                  Object.entries(data.footer.social).map(([platform, url]: [string, any]) => {
                    if (url && url !== '<>') {
                      return (
                        <Button key={platform} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                          {platform.charAt(0).toUpperCase()}
                        </Button>
                      );
                    }
                    return null;
                  })
                ) : (
                  <p className="text-xs text-slate-500">Social links not provided</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-700 mt-6 pt-4 text-center text-sm text-slate-400">
          <p>© 2025 {data.footer?.company || company.name} • Verified by Eyes AI • Last Updated: {data.audit?.last_updated || 'Not specified'}</p>
        </div>
      </Card>
    </div>
  );
}