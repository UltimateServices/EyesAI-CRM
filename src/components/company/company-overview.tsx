'use client';

import { Company } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Globe, 
  Mail, 
  MapPin,
  Clock,
  Star,
  ExternalLink,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface CompanyOverviewProps {
  company: Company;
}

export function CompanyOverview({ company }: CompanyOverviewProps) {
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const intake = getIntakeByCompanyId(company.id);
  
  if (!intake?.romaData) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-slate-600 mb-4">No intake data available yet.</p>
          <p className="text-sm text-slate-500">Go to the Intake tab to import ROMA-PDF data.</p>
        </div>
      </Card>
    );
  }

  const data = intake.romaData;

  // Safe getter functions
  const safeGet = (obj: any, path: string, fallback: any = '') => {
    try {
      return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? fallback;
    } catch {
      return fallback;
    }
  };

  const safeArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
  };

  const safeString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* AI Overview */}
      {data.ai_overview?.overview_line && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">AI Summary</h3>
              <p className="text-slate-700">{data.ai_overview.overview_line}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Hero Section */}
      {data.hero && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {safeGet(data, 'hero.business_name') || safeGet(data, 'hero.company_name') || company.name}
              </h1>
              {data.hero.tagline && (
                <p className="text-lg text-slate-600">{data.hero.tagline}</p>
              )}
            </div>
          </div>

          {/* Badges */}
          {safeArray(data.hero.badges).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {safeArray(data.hero.badges).map((badge: any, idx: number) => (
                <Badge key={idx} variant="secondary">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {safeString(badge)}
                </Badge>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          {data.hero.quick_actions && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {safeGet(data, 'hero.quick_actions.call_tel') && (
                <Button asChild variant="outline" className="w-full">
                  <a href={safeGet(data, 'hero.quick_actions.call_tel')}>
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </a>
                </Button>
              )}
              {safeGet(data, 'hero.quick_actions.website_url') && (
                <Button asChild variant="outline" className="w-full">
                  <a href={safeGet(data, 'hero.quick_actions.website_url')} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
              {safeGet(data, 'hero.quick_actions.email_mailto') && (
                <Button asChild variant="outline" className="w-full">
                  <a href={safeGet(data, 'hero.quick_actions.email_mailto')}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
              {safeGet(data, 'hero.quick_actions.maps_link') && (
                <Button asChild variant="outline" className="w-full">
                  <a href={safeGet(data, 'hero.quick_actions.maps_link')} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" />
                    Directions
                  </a>
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* About & Badges */}
      {data.about_and_badges && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            About {safeGet(data, 'hero.business_name') || safeGet(data, 'hero.company_name') || company.name}
          </h2>
          {data.about_and_badges.ai_summary_120w && (
            <p className="text-slate-700 leading-relaxed mb-4">
              {data.about_and_badges.ai_summary_120w}
            </p>
          )}
          {safeArray(data.about_and_badges.company_badges).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {safeArray(data.about_and_badges.company_badges).map((badge: any, idx: number) => (
                <Badge key={idx} variant="outline">
                  {safeString(badge)}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Services */}
      {safeArray(data.services).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {data.services_section_title || 'Our Services'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safeArray(data.services).map((service: any, idx: number) => (
              <Card key={idx} className="p-4 border-2">
                <div className="flex items-start gap-3 mb-3">
                  {service.emoji && <span className="text-2xl">{service.emoji}</span>}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{service.title || 'Service'}</h3>
                    {service.pricing_label && (
                      <p className="text-sm font-medium text-green-600">{service.pricing_label}</p>
                    )}
                  </div>
                </div>
                {service.summary_1line && (
                  <p className="text-sm text-slate-600 mb-3">{service.summary_1line}</p>
                )}
                {safeArray(service.whats_included).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase">What's Included:</p>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {safeArray(service.whats_included).map((item: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{safeString(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {service.duration && (
                  <p className="text-xs text-slate-500 mt-3">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {service.duration}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Reference Guide - FIXED TO HANDLE BOTH FORMATS */}
      {(() => {
        // Try multiple possible structures
        const guide = data.quick_reference_guide;
        if (!guide) return null;

        // Option 1: table.headers and table.rows
        const headers = guide.table?.headers || guide.columns || [];
        const rows = guide.table?.rows || guide.rows || [];
        const title = guide.title || guide.description || 'Quick Reference Guide';

        if (safeArray(headers).length === 0 || safeArray(rows).length === 0) return null;

        return (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
            {guide.description && guide.description !== title && (
              <p className="text-slate-600 mb-4">{guide.description}</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    {safeArray(headers).map((col: any, idx: number) => (
                      <th key={idx} className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">
                        {safeString(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {safeArray(rows).map((row: any, rowIdx: number) => (
                    <tr key={rowIdx} className="hover:bg-slate-50">
                      {safeArray(row).map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="border border-slate-300 px-4 py-2 text-sm">
                          {safeString(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}

      {/* Pricing Information */}
      {data.pricing_information && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-xl font-bold text-slate-900 mb-3">💰 Pricing Information</h2>
          {data.pricing_information.summary_line && (
            <p className="text-slate-700 mb-4">{data.pricing_information.summary_line}</p>
          )}
          {safeArray(data.pricing_information.pricing_notes).length > 0 && (
            <ul className="text-sm text-slate-700 space-y-1 mb-4">
              {safeArray(data.pricing_information.pricing_notes).map((note: any, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{safeString(note)}</span>
                </li>
              ))}
            </ul>
          )}
          {safeArray(data.pricing_information.cta_buttons).length > 0 && (
            <div className="flex flex-wrap gap-3">
              {safeArray(data.pricing_information.cta_buttons).map((button: any, idx: number) => (
                <Button key={idx} variant="default" size="sm">
                  {safeString(button)}
                </Button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* What to Expect */}
      {safeArray(data.what_to_expect).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">What to Expect: Common Scenarios</h2>
          <div className="space-y-6">
            {safeArray(data.what_to_expect).map((card: any, idx: number) => (
              <Card key={idx} className="p-4 border-2">
                <div className="flex items-start gap-3 mb-3">
                  {card.emoji && <span className="text-2xl">{card.emoji}</span>}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{card.title || 'Scenario'}</h3>
                    {card.recommended_for && (
                      <p className="text-sm text-slate-600 mt-1">
                        <strong>Recommended:</strong> {card.recommended_for}
                      </p>
                    )}
                  </div>
                </div>
                {safeArray(card.whats_involved).length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">What's Involved:</p>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {safeArray(card.whats_involved).map((item: any, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{safeString(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {card.pro_tip && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">💡 Pro Tip:</span> {card.pro_tip}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Location & Hours - Handles ALL formats */}
      {data.locations_and_hours && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Location(s)</h2>
          
          {/* Primary Location - Handles ALL 5 patterns */}
          {(() => {
            const locHours = data.locations_and_hours;
            const primaryLoc = locHours.primary_location;
            let addressLines: string[] = [];
            
            // Pattern 1: primary_location.full_address (Major Dumpsters)
            if (primaryLoc?.full_address) {
              addressLines = [primaryLoc.full_address];
            }
            // Pattern 2: primary_location with address_line_1 (Car Shipping Kings)
            else if (primaryLoc?.address_line_1) {
              if (primaryLoc.address_line_1) addressLines.push(primaryLoc.address_line_1);
              if (primaryLoc.address_line_2) addressLines.push(primaryLoc.address_line_2);
              const cityStateZip = [primaryLoc.city, primaryLoc.state, primaryLoc.zip].filter(Boolean).join(', ');
              if (cityStateZip) addressLines.push(cityStateZip);
            }
            // Pattern 3: primary_location with address_line1 (Idaho Supreme - note: line1 not line_1)
            else if (primaryLoc?.address_line1) {
              if (primaryLoc.address_line1) addressLines.push(primaryLoc.address_line1);
              if (primaryLoc.address_line2) addressLines.push(primaryLoc.address_line2);
              const cityStateZip = [primaryLoc.city, primaryLoc.state, primaryLoc.zip].filter(Boolean).join(', ');
              if (cityStateZip) addressLines.push(cityStateZip);
            }
            // Pattern 4: Direct full_address (Captain Mike's, ZoRoCo)
            else if (locHours.full_address) {
              addressLines = [locHours.full_address];
            }
            // Pattern 5: Fallback to city_state if available (Captain Mike's)
            else if (locHours.city_state) {
              addressLines = [locHours.city_state];
            }
            // Pattern 6: Last resort - extract city + state from primary_location
            else if (primaryLoc?.city && primaryLoc?.state) {
              addressLines = [`${primaryLoc.city}, ${primaryLoc.state}`];
            }
            
            if (addressLines.length > 0) {
              return (
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Primary Location
                  </h3>
                  <div className="space-y-2 ml-7">
                    {addressLines.map((line, idx) => (
                      <p key={idx} className="text-slate-700">{line}</p>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Multiple Locations Array */}
          {safeArray(data.locations_and_hours.locations).length > 0 && (
            <div className="space-y-6 mb-6">
              {safeArray(data.locations_and_hours.locations).map((location: any, idx: number) => (
                <div key={idx} className={`${idx < safeArray(data.locations_and_hours.locations).length - 1 ? 'pb-6 border-b' : ''}`}>
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    {location.name || `Location ${idx + 1}`}
                  </h3>
                  <div className="space-y-2 ml-7">
                    {location.address_line1 && (
                      <p className="text-slate-700">{location.address_line1}</p>
                    )}
                    {location.city_state_zip && (
                      <p className="text-slate-700">{location.city_state_zip}</p>
                    )}
                    {location.phone && (
                      <p className="text-slate-700">
                        <Phone className="w-4 h-4 inline mr-2" />
                        {location.phone}
                      </p>
                    )}
                    {location.google_maps_embed_url && 
                     location.google_maps_embed_url !== '<>' && (
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <a href={location.google_maps_embed_url} target="_blank" rel="noopener noreferrer">
                          <MapPin className="w-4 h-4 mr-2" />
                          Get Directions →
                        </a>
                      </Button>
                    )}
                    
                    {/* Location-specific hours if available */}
                    {location.hours && Object.keys(location.hours).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-slate-700 mb-2">Hours:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(location.hours).map(([day, hours]: [string, any]) => (
                            <div key={day} className="flex justify-between text-sm">
                              <span className="font-medium capitalize text-slate-700">{day}</span>
                              <span className="text-slate-600">{safeString(hours)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Service Area */}
          {data.locations_and_hours.service_area_text && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Service Area</h3>
              <p className="text-slate-700">{data.locations_and_hours.service_area_text}</p>
            </div>
          )}

          {/* General Hours - Handles both OBJECT and ARRAY formats */}
          {(() => {
            const hours = data.locations_and_hours.opening_hours;
            if (!hours) return null;
            
            // Check if it's an array (ZoRoCo format)
            if (Array.isArray(hours) && hours.length > 0) {
              return (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Hours of Operation</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hours.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.day}</span>
                        <span className="text-slate-600">{item.hours}</span>
                      </div>
                    ))}
                  </div>
                  {data.locations_and_hours.hours_note && (
                    <p className="text-sm text-slate-500 mt-3">{data.locations_and_hours.hours_note}</p>
                  )}
                </div>
              );
            }
            
            // Otherwise it's an object (Major, Car Shipping, etc.)
            if (typeof hours === 'object' && Object.keys(hours).length > 0) {
              return (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Hours of Operation</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(hours).map(([day, hoursStr]: [string, any]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="font-medium capitalize text-slate-700">{day}</span>
                        <span className="text-slate-600">{safeString(hoursStr)}</span>
                      </div>
                    ))}
                  </div>
                  {data.locations_and_hours.hours_note && (
                    <p className="text-sm text-slate-500 mt-3">{data.locations_and_hours.hours_note}</p>
                  )}
                </div>
              );
            }
            
            return null;
          })()}
        </Card>
      )}

      {/* FAQs */}
      {data.faqs?.all_questions && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">❓ Frequently Asked Questions</h2>
          
          {/* What's New */}
          {data.faqs.whats_new?.questions && safeArray(data.faqs.whats_new.questions).length > 0 && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">
                What's New? {data.faqs.whats_new.month_label && `(${data.faqs.whats_new.month_label})`}
              </h3>
              <div className="space-y-4">
                {safeArray(data.faqs.whats_new.questions).map((faq: any, idx: number) => (
                  <div key={idx}>
                    <p className="font-medium text-slate-900 mb-1">{safeString(faq.question || faq.q)}</p>
                    <p className="text-slate-700">{safeString(faq.answer || faq.a)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Questions by Category */}
          <div className="space-y-6">
            {Object.entries(data.faqs.all_questions).map(([category, questions]: [string, any]) => (
              <div key={category}>
                <h3 className="font-semibold text-slate-900 mb-3 capitalize">
                  {category.replace(/_/g, ' ')}
                </h3>
                <div className="space-y-4">
                  {safeArray(questions).map((faq: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-medium text-slate-900 mb-1">{safeString(faq.question || faq.q)}</p>
                      <p className="text-slate-700">{safeString(faq.answer || faq.a)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews */}
      {safeArray(data.featured_reviews?.items).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Featured Reviews</h2>
          <div className="space-y-4">
            {safeArray(data.featured_reviews.items).map((review: any, idx: number) => (
              <Card key={idx} className="p-4 border-2">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{review.reviewer || 'Anonymous'}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="flex">
                        {Array.from({ length: review.stars || 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      {review.date && <span>• {review.date}</span>}
                      {review.source && <span>• {review.source}</span>}
                    </div>
                  </div>
                </div>
                {review.excerpt && (
                  <p className="text-slate-700 italic">"{review.excerpt}"</p>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Photo Gallery */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">📸 Photo Gallery</h2>
        {(() => {
          // Combine intake ROMA images + Media tab uploaded images
          const intakeImages = safeArray(data.photo_gallery?.images)
            .filter((img: any) => img.image_url && img.image_url !== '<>')
            .map((img: any) => ({
              url: img.image_url,
              alt: img.alt || 'Gallery image',
              source: 'intake'
            }));
          
          // Read from intake.galleryLinks (array of strings)
          const uploadedImages = safeArray(intake?.galleryLinks)
            .map((url: string) => ({
              url: url,
              alt: 'Uploaded image',
              source: 'uploaded'
            }));
          
          const allImages = [...intakeImages, ...uploadedImages];
          
          return allImages.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">{intakeImages.length}</span> from intake • <span className="font-medium">{uploadedImages.length}</span> uploaded
                </p>
                <Badge variant="outline" className="font-semibold">
                  {allImages.length} total {allImages.length === 1 ? 'image' : 'images'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allImages.map((image: any, idx: number) => (
                  <div key={idx} className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border-2 hover:border-blue-400 transition-colors group">
                    <img 
                      src={image.url} 
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3Ctext fill="%2394a3b8" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage Unavailable%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge 
                        variant={image.source === 'intake' ? 'secondary' : 'default'} 
                        className="text-xs shadow-lg"
                      >
                        {image.source === 'intake' ? '📋 Intake' : '📤 Uploaded'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              {data.photo_gallery?.note && (
                <p className="text-sm text-slate-500 mt-4 italic">{data.photo_gallery.note}</p>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
              <p className="text-slate-400 italic mb-3">No photos available yet</p>
              <p className="text-xs text-slate-500">
                Images from intake will appear here automatically. You can also upload images in the Media tab.
              </p>
            </div>
          );
        })()}
      </Card>

      {/* Monthly Activity */}
      {(data.eyes_ai_monthly_activity?.discover || data.eyes_ai_monthly_activity?.verified) && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Monthly Activity Section</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.eyes_ai_monthly_activity.discover && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Discover Package</h3>
                <div className="flex flex-wrap gap-2">
                  {safeArray(data.eyes_ai_monthly_activity.discover).map((item: any, idx: number) => (
                    <Badge key={idx} variant="outline">{safeString(item)}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.eyes_ai_monthly_activity.verified && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Verified Package</h3>
                <div className="flex flex-wrap gap-2">
                  {safeArray(data.eyes_ai_monthly_activity.verified).map((item: any, idx: number) => (
                    <Badge key={idx} variant="outline">{safeString(item)}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          {data.eyes_ai_monthly_activity.note && (
            <p className="text-sm text-slate-500 mt-4">{data.eyes_ai_monthly_activity.note}</p>
          )}
        </Card>
      )}

      {/* Get in Touch */}
      {data.get_in_touch && (
        <Card className="p-6 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Get in Touch with {data.get_in_touch.company_name || company.name}
          </h2>
          {data.get_in_touch.city_state && (
            <p className="text-slate-600 mb-2">{data.get_in_touch.city_state}</p>
          )}
          {data.get_in_touch.tagline && (
            <p className="text-sm text-slate-500 mb-4">{data.get_in_touch.tagline}</p>
          )}
          {safeArray(data.get_in_touch.buttons).length > 0 && (
            <div className="flex flex-wrap gap-3">
              {safeArray(data.get_in_touch.buttons).map((button: any, idx: number) => (
                <Button key={idx} variant="default" size="sm">
                  {safeString(button)}
                </Button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}