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
                {safeGet(data, 'hero.business_name') || company.name}
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
            About {safeGet(data, 'hero.business_name') || company.name}
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

      {/* Quick Reference Guide */}
      {data.quick_reference_guide?.columns && data.quick_reference_guide?.rows && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {data.quick_reference_guide.title || 'Quick Reference Guide'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {safeArray(data.quick_reference_guide.columns).map((col: any, idx: number) => (
                    <th key={idx} className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">
                      {safeString(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safeArray(data.quick_reference_guide.rows).map((row: any, rowIdx: number) => (
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
      )}

      {/* Pricing Information */}
      {data.pricing_information && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-xl font-bold text-slate-900 mb-3">💰 Pricing Information</h2>
          {data.pricing_information.summary_line && (
            <p className="text-slate-700 mb-4">{data.pricing_information.summary_line}</p>
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

      {/* Location & Hours */}
      {data.locations_and_hours && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Location(s)</h2>
          
          {/* Primary Location */}
          {data.locations_and_hours.primary_location && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3">📍 Primary Location</h3>
              <div className="space-y-2">
                {safeGet(data, 'locations_and_hours.primary_location.address_line1') && (
                  <p className="text-slate-700">
                    {safeGet(data, 'locations_and_hours.primary_location.address_line1')}
                  </p>
                )}
                {safeGet(data, 'locations_and_hours.primary_location.city_state_zip') && (
                  <p className="text-slate-700">
                    {safeGet(data, 'locations_and_hours.primary_location.city_state_zip')}
                  </p>
                )}
                {safeGet(data, 'locations_and_hours.primary_location.google_maps_embed_url') && 
                 safeGet(data, 'locations_and_hours.primary_location.google_maps_embed_url') !== '<>' && (
                  <Button asChild variant="outline" size="sm">
                    <a href={safeGet(data, 'locations_and_hours.primary_location.google_maps_embed_url')} target="_blank" rel="noopener noreferrer">
                      <MapPin className="w-4 h-4 mr-2" />
                      Get Directions →
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Service Area */}
          {data.locations_and_hours.service_area_text && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">Service Area</h3>
              <p className="text-slate-700">{data.locations_and_hours.service_area_text}</p>
            </div>
          )}

          {/* Hours */}
          {data.locations_and_hours.opening_hours && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Hours of Operation</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(data.locations_and_hours.opening_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="font-medium capitalize text-slate-700">{day}</span>
                    <span className="text-slate-600">{safeString(hours)}</span>
                  </div>
                ))}
              </div>
              {data.locations_and_hours.hours_note && (
                <p className="text-sm text-slate-500 mt-3">{data.locations_and_hours.hours_note}</p>
              )}
            </div>
          )}
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
      {safeArray(data.photo_gallery?.images).filter((img: any) => img.image_url && img.image_url !== '<>').length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Photo Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {safeArray(data.photo_gallery.images)
              .filter((img: any) => img.image_url && img.image_url !== '<>')
              .map((image: any, idx: number) => (
                <div key={idx} className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                  <img 
                    src={image.image_url} 
                    alt={image.alt || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f1f5f9" width="100" height="100"/%3E%3Ctext fill="%2394a3b8" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              ))}
          </div>
          {data.photo_gallery.note && (
            <p className="text-sm text-slate-500 mt-4">{data.photo_gallery.note}</p>
          )}
        </Card>
      )}

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