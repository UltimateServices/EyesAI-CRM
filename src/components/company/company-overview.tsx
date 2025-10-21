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

  // Helper: Render badge (handles BOTH string and object formats)
  const renderBadge = (badge: any): string => {
    // If it's already a string, return it
    if (typeof badge === 'string') {
      return badge;
    }
    
    // If it's an object with icon and text properties
    if (badge && typeof badge === 'object') {
      const icon = badge.icon || '';
      const text = badge.text || '';
      
      // Combine icon and text with a space
      if (icon && text) {
        return `${icon} ${text}`;
      }
      
      // Return whichever exists
      if (text) return text;
      if (icon) return icon;
      
      // Fallback to stringifying the object
      return safeString(badge);
    }
    
    // Last resort fallback
    return safeString(badge);
  };

  // Helper: Get location address lines (handles ALL formats)
  const getLocationAddress = (): string[] => {
    const locHours = data.locations_and_hours;
    if (!locHours) return [];
    
    const primaryLoc = locHours.primary_location;
    
    // Try Pattern 1: primary_location.full_address (Major Dumpsters)
    if (primaryLoc && primaryLoc.full_address) {
      return [primaryLoc.full_address];
    }
    
    // Try Pattern 2: Build from primary_location fields
    if (primaryLoc) {
      const lines: string[] = [];
      
      // Get street address (handle both address_line_1 and address_line1)
      const street1 = primaryLoc.address_line_1 || primaryLoc.address_line1;
      const street2 = primaryLoc.address_line_2 || primaryLoc.address_line2;
      
      if (street1) lines.push(street1);
      if (street2) lines.push(street2);
      
      // Get city/state/zip from primary_location OR fall back to root level
      const city = primaryLoc.city || locHours.city;
      const state = primaryLoc.state || locHours.state;
      const zip = primaryLoc.zip || locHours.zip;
      
      const cityParts = [city, state, zip].filter(Boolean);
      if (cityParts.length > 0) {
        lines.push(cityParts.join(', '));
      }
      
      // Only return if we have complete address (street + city/state)
      if (lines.length >= 2) {
        return lines;
      }
    }
    
    // Try Pattern 3: Direct full_address at root level (Captain Mike's, ZoRoCo)
    if (locHours.full_address) {
      return [locHours.full_address];
    }
    
    // Try Pattern 4: city_state field (Captain Mike's)
    if (locHours.city_state) {
      return [locHours.city_state];
    }
    
    // Try Pattern 5: Fallback to any city + state we can find
    const city = (primaryLoc && primaryLoc.city) || locHours.city || '';
    const state = (primaryLoc && primaryLoc.state) || locHours.state || '';
    
    if (city && state) {
      return [`${city}, ${state}`];
    }
    
    if (city) return [city];
    if (state) return [state];
    
    // No location found
    return [];
  };

  // Helper: Get table data (handles BOTH formats explicitly)
  const getTableData = (): { title: string; description: string | null; headers: any[]; rows: any[] } | null => {
    const guide = data.quick_reference_guide;
    
    // No guide section at all
    if (!guide) {
      return null;
    }
    
    let headers: any[] = [];
    let rows: any[] = [];
    
    // Try Format 1: table.headers + table.rows (Car Shipping)
    if (guide.table) {
      if (guide.table.headers) {
        headers = safeArray(guide.table.headers);
      }
      if (guide.table.rows) {
        rows = safeArray(guide.table.rows);
      }
    }
    
    // Try Format 2: Direct columns + rows (Major Dumpsters)
    if (headers.length === 0 && guide.columns) {
      headers = safeArray(guide.columns);
    }
    if (rows.length === 0 && guide.rows) {
      rows = safeArray(guide.rows);
    }
    
    // If we still don't have data, return null
    if (headers.length === 0 || rows.length === 0) {
      return null;
    }
    
    // Build title and description
    const title = guide.title || guide.description || guide.table_title || 'Quick Reference Guide';
    const description = (guide.description && guide.description !== guide.title) ? guide.description : null;
    
    return {
      title,
      description,
      headers,
      rows
    };
  };

  // Helper: Clean and format hours string
  const formatHoursString = (hoursStr: string): JSX.Element => {
    // Detect if hours contain multiple segments (Office, Shipping, etc.)
    const hasMultipleSegments = hoursStr.includes('Office:') || 
                                 hoursStr.includes('Shipping:') || 
                                 hoursStr.includes('|');
    
    if (hasMultipleSegments) {
      // Split by pipe and clean up each segment
      const segments = hoursStr.split('|').map(s => s.trim());
      
      return (
        <div className="text-right">
          {segments.map((segment, idx) => (
            <div key={idx} className="text-slate-600 text-xs leading-relaxed">
              {segment}
            </div>
          ))}
        </div>
      );
    }
    
    // Simple hours string
    return <span className="text-slate-600">{hoursStr}</span>;
  };

  // Helper: Render hours (handles BOTH object and array formats)
  const renderHours = () => {
    const hours = data.locations_and_hours?.opening_hours;
    
    if (!hours) {
      return null;
    }
    
    // Format 1: Array of {day, hours} objects (ZoRoCo)
    if (Array.isArray(hours)) {
      if (hours.length === 0) return null;
      
      return (
        <>
          {hours.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-start text-sm gap-4">
              <span className="font-medium text-slate-700">{item.day}</span>
              {formatHoursString(safeString(item.hours))}
            </div>
          ))}
        </>
      );
    }
    
    // Format 2: Object with day keys (Major, Car Shipping, Idaho)
    if (typeof hours === 'object' && hours !== null) {
      const entries = Object.entries(hours);
      
      if (entries.length === 0) return null;
      
      return (
        <>
          {entries.map(([day, hoursStr]: [string, any]) => (
            <div key={day} className="flex justify-between items-start text-sm gap-4">
              <span className="font-medium capitalize text-slate-700">{day}</span>
              {formatHoursString(safeString(hoursStr))}
            </div>
          ))}
        </>
      );
    }
    
    return null;
  };

  // Pre-compute values
  const tableData = getTableData();
  const locationLines = getLocationAddress();
  const hoursContent = renderHours();

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

          {/* Badges - FIXED to handle both formats */}
          {safeArray(data.hero.badges).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {safeArray(data.hero.badges).map((badge: any, idx: number) => (
                <Badge key={idx} variant="secondary">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {renderBadge(badge)}
                </Badge>
              ))}
            </div>
          )}

          {/* Quick Actions - Handles both OBJECT and ARRAY formats */}
          {data.hero.quick_actions && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.isArray(data.hero.quick_actions) ? (
                // Array format (Captain Mike's, ZoRoCo)
                data.hero.quick_actions.map((action: any, idx: number) => {
                  const href = action.value || action.call_tel || action.website_url || action.email_mailto || action.maps_link;
                  const isExternal = href?.includes('http') || href?.includes('maps.google');
                  const icon = action.icon || action.action_type;
                  
                  return (
                    <Button key={idx} asChild variant="outline" className="w-full">
                      <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
                        {icon?.includes('phone') || action.label?.toLowerCase().includes('call') ? <Phone className="w-4 h-4 mr-2" /> :
                         icon?.includes('globe') || action.label?.toLowerCase().includes('website') ? <Globe className="w-4 h-4 mr-2" /> :
                         icon?.includes('mail') || action.label?.toLowerCase().includes('email') ? <Mail className="w-4 h-4 mr-2" /> :
                         icon?.includes('map') || action.label?.toLowerCase().includes('direction') ? <MapPin className="w-4 h-4 mr-2" /> : null}
                        {action.label || 'Contact'}
                      </a>
                    </Button>
                  );
                })
              ) : (
                // Object format (Major, Car Shipping)
                <>
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
                </>
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
                  {renderBadge(badge)}
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

      {/* Quick Reference Guide - FIXED with explicit conditional */}
      {tableData && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">{tableData.title}</h2>
          {tableData.description && (
            <p className="text-slate-600 mb-4">{tableData.description}</p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {tableData.headers.map((col: any, idx: number) => (
                    <th key={idx} className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">
                      {safeString(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row: any, rowIdx: number) => (
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

      {/* Location & Hours - FIXED */}
      {data.locations_and_hours && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Location(s)</h2>
          
          {/* Primary Location */}
          {locationLines.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Primary Location
              </h3>
              <div className="space-y-2 ml-7">
                {locationLines.map((line, idx) => (
                  <p key={idx} className="text-slate-700">{line}</p>
                ))}
              </div>
            </div>
          )}

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

          {/* General Hours */}
          {hoursContent && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Hours of Operation</h3>
              <div className="space-y-2">
                {hoursContent}
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
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">📸 Photo Gallery</h2>
        {(() => {
          const intakeImages = safeArray(data.photo_gallery?.images)
            .filter((img: any) => img.image_url && img.image_url !== '<>')
            .map((img: any) => ({
              url: img.image_url,
              alt: img.alt || 'Gallery image',
              source: 'intake'
            }));
          
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