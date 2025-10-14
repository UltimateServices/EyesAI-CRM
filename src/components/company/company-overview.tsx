'use client';

import { Company, Intake } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  Star,
  BarChart,
  Image as ImageIcon,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

interface CompanyOverviewProps {
  company: Company;
  intake?: Intake | null;
}

export function CompanyOverview({ company, intake }: CompanyOverviewProps) {
  if (!intake || intake.status !== 'complete') {
    return (
      <Card className="p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Intake Data Available</h3>
          <p className="text-slate-600">
            Complete the intake form to see detailed company information here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Part 1 - Basic Business Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Basic Business Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {intake.legalCanonicalName && (
            <div>
              <p className="text-sm font-medium text-slate-500">Legal/Canonical Name</p>
              <p className="text-slate-900 mt-1">{intake.legalCanonicalName}</p>
            </div>
          )}
          {intake.alsoKnownAs && (
            <div>
              <p className="text-sm font-medium text-slate-500">Also Known As</p>
              <p className="text-slate-900 mt-1">{intake.alsoKnownAs}</p>
            </div>
          )}
          {intake.industryCategoryBadges && (
            <div>
              <p className="text-sm font-medium text-slate-500">Industry / Category</p>
              <p className="text-slate-900 mt-1">{intake.industryCategoryBadges}</p>
            </div>
          )}
          {intake.yearEstablished && (
            <div>
              <p className="text-sm font-medium text-slate-500">Year Established</p>
              <p className="text-slate-900 mt-1">{intake.yearEstablished}</p>
            </div>
          )}
          {intake.ownershipHeritage && (
            <div>
              <p className="text-sm font-medium text-slate-500">Ownership / Heritage</p>
              <p className="text-slate-900 mt-1">{intake.ownershipHeritage}</p>
            </div>
          )}
          {intake.businessStatus && (
            <div>
              <p className="text-sm font-medium text-slate-500">Business Status</p>
              <p className="text-slate-900 mt-1">{intake.businessStatus}</p>
            </div>
          )}
          {intake.taglineSlogan && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-500">Tagline/Slogan</p>
              <p className="text-slate-900 mt-1 italic">{intake.taglineSlogan}</p>
            </div>
          )}
          {intake.shortDescription && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-500">Description</p>
              <p className="text-slate-900 mt-1">{intake.shortDescription}</p>
            </div>
          )}
          {intake.verificationTier && (
            <div>
              <p className="text-sm font-medium text-slate-500">Verification Tier</p>
              <Badge className="mt-1 bg-green-100 text-green-700">{intake.verificationTier}</Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Part 2 - Contact Information */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {intake.website && (
            <div>
              <p className="text-sm font-medium text-slate-500">Website</p>
              <a href={intake.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 flex items-center gap-1">
                {intake.website} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          {intake.mainPhone && (
            <div>
              <p className="text-sm font-medium text-slate-500">Primary Phone</p>
              <p className="text-slate-900 mt-1">{intake.mainPhone}</p>
            </div>
          )}
          {intake.physicalAddress && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-500">Address (NAP)</p>
              <p className="text-slate-900 mt-1">{intake.physicalAddress}</p>
            </div>
          )}
          {intake.onlineOrdering && (
            <div>
              <p className="text-sm font-medium text-slate-500">Online Ordering</p>
              <p className="text-slate-900 mt-1">{intake.onlineOrdering}</p>
            </div>
          )}
          {intake.emails && (
            <div>
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="text-slate-900 mt-1 whitespace-pre-line">{typeof intake.emails === 'string' ? intake.emails : intake.emails.join('\n')}</p>
            </div>
          )}
          {intake.canonicalDomain && (
            <div>
              <p className="text-sm font-medium text-slate-500">Canonical Domain</p>
              <a href={intake.canonicalDomain} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 flex items-center gap-1">
                {intake.canonicalDomain} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Part 3 - Geolocation Data */}
      {(intake.latitudeLongitude || intake.geoSource) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Geolocation Data</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intake.latitudeLongitude && (
              <div>
                <p className="text-sm font-medium text-slate-500">Latitude/Longitude</p>
                <p className="text-slate-900 mt-1 font-mono">{intake.latitudeLongitude}</p>
              </div>
            )}
            {intake.geoSource && (
              <div>
                <p className="text-sm font-medium text-slate-500">Geo Source</p>
                <p className="text-slate-900 mt-1">{intake.geoSource}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Part 4 - Service Area */}
      {(intake.localFocus || intake.primaryNearbyTowns) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Service Area / Delivery Zone</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intake.localFocus && (
              <div>
                <p className="text-sm font-medium text-slate-500">Local Focus</p>
                <p className="text-slate-900 mt-1">{intake.localFocus}</p>
              </div>
            )}
            {intake.primaryNearbyTowns && (
              <div>
                <p className="text-sm font-medium text-slate-500">Primary Nearby Towns</p>
                <p className="text-slate-900 mt-1">{intake.primaryNearbyTowns}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Part 5 - Business Hours & Availability */}
      {(intake.businessHours || intake.responseTime) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Business Hours & Availability</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intake.businessHours && (
              <div>
                <p className="text-sm font-medium text-slate-500">Store Hours</p>
                <p className="text-slate-900 mt-1 whitespace-pre-line">{intake.businessHours}</p>
              </div>
            )}
            {intake.responseTime && (
              <div>
                <p className="text-sm font-medium text-slate-500">Response Time</p>
                <p className="text-slate-900 mt-1">{intake.responseTime}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Part 6 - Services / Products Offered */}
      {intake.servicesOffered && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Services / Products Offered</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-slate-900 whitespace-pre-line">{intake.servicesOffered}</p>
          </div>
        </Card>
      )}

      {/* Part 7 - Reviews & Reputation */}
      {(intake.verifiedFiveStarTotal || intake.googleReviewsTotal || intake.reviewLinks || intake.yelpInfo || intake.facebookInfo || intake.tripadvisorInfo || intake.directProfiles) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Reviews & Reputation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intake.verifiedFiveStarTotal && (
              <div>
                <p className="text-sm font-medium text-slate-500">⭐ Verified 5-Star Reviews</p>
                <p className="text-slate-900 mt-1">{intake.verifiedFiveStarTotal}</p>
              </div>
            )}
            {intake.googleReviewsTotal && (
              <div>
                <p className="text-sm font-medium text-slate-500">Google Reviews Total</p>
                <p className="text-slate-900 mt-1">{intake.googleReviewsTotal}</p>
              </div>
            )}
            {intake.reviewLinks && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-slate-500">Review Links</p>
                <p className="text-slate-900 mt-1">{intake.reviewLinks}</p>
              </div>
            )}
            {intake.yelpInfo && (
              <div>
                <p className="text-sm font-medium text-slate-500">Yelp</p>
                <p className="text-slate-900 mt-1">{intake.yelpInfo}</p>
              </div>
            )}
            {intake.facebookInfo && (
              <div>
                <p className="text-sm font-medium text-slate-500">Facebook</p>
                <p className="text-slate-900 mt-1">{intake.facebookInfo}</p>
              </div>
            )}
            {intake.tripadvisorInfo && (
              <div>
                <p className="text-sm font-medium text-slate-500">TripAdvisor</p>
                <p className="text-slate-900 mt-1">{intake.tripadvisorInfo}</p>
              </div>
            )}
            {intake.directProfiles && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-slate-500">Direct Profiles</p>
                <p className="text-slate-900 mt-1 whitespace-pre-line">{intake.directProfiles}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Part 8 - Key Metrics & Differentiators */}
      {(intake.quickFacts || intake.primarySeoKeywords || intake.verifiedFallbackBadges) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Key Metrics & Differentiators</h3>
          </div>
          <div className="space-y-4">
            {intake.quickFacts && (
              <div>
                <p className="text-sm font-medium text-slate-500">Quick Facts</p>
                <p className="text-slate-900 mt-1 whitespace-pre-line">{intake.quickFacts}</p>
              </div>
            )}
            {intake.primarySeoKeywords && (
              <div>
                <p className="text-sm font-medium text-slate-500">Primary SEO Keywords</p>
                <p className="text-slate-900 mt-1 whitespace-pre-line">{intake.primarySeoKeywords}</p>
              </div>
            )}
            {intake.verifiedFallbackBadges && (
              <div>
                <p className="text-sm font-medium text-slate-500">Verified/Fallback Badges</p>
                <p className="text-slate-900 mt-1 whitespace-pre-line">{intake.verifiedFallbackBadges}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Part 9 - Social Media & Media Links */}
      {(intake.instagramUrl || intake.facebookUrl || intake.galleryUrl || intake.recipesUrl) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Social Media & Media Links</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intake.instagramUrl && (
              <div>
                <p className="text-sm font-medium text-slate-500">Instagram</p>
                <a href={intake.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 flex items-center gap-1">
                  {intake.instagramUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {intake.facebookUrl && (
              <div>
                <p className="text-sm font-medium text-slate-500">Facebook</p>
                <a href={intake.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 flex items-center gap-1">
                  {intake.facebookUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {intake.galleryUrl && (
              <div>
                <p className="text-sm font-medium text-slate-500">Gallery</p>
                <a href={intake.galleryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 flex items-center gap-1">
                  {intake.galleryUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {intake.recipesUrl && (
              <div>
                <p className="text-sm font-medium text-slate-500">Recipes</p>
                <a href={intake.recipesUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-1 flex items-center gap-1">
                  {intake.recipesUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Part 10 - Visual Assets */}
      {intake.visualAssets && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Visual Assets / Gallery</h3>
          </div>
          <p className="text-slate-900">{intake.visualAssets}</p>
        </Card>
      )}

      {/* Part 11 - FAQs */}
      {intake.faqs && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">FAQs</h3>
          </div>
          <div className="prose prose-sm max-w-none">
            <p className="text-slate-900 whitespace-pre-line">{intake.faqs}</p>
          </div>
        </Card>
      )}

      {/* SEO Summary */}
      {(intake.changeLogConfidenceGaps || intake.comparativeValueTable || intake.metaTitle || intake.metaDescription || intake.jsonLdSchema || intake.internalLinks || intake.externalCitations || intake.schemaElementsIncluded || intake.aiDiscoveryTier || intake.lastUpdatedDate) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">SEO Summary</h3>
          </div>
          <div className="space-y-4">
            {intake.changeLogConfidenceGaps && (
              <div>
                <p className="text-sm font-medium text-slate-500">Change Log & Confidence Gaps</p>
                <p className="text-slate-900 mt-1 whitespace-pre-line text-sm">{intake.changeLogConfidenceGaps}</p>
              </div>
            )}
            {intake.comparativeValueTable && (
              <div>
                <p className="text-sm font-medium text-slate-500">Comparative Value Table</p>
                <p className="text-slate-900 mt-1 whitespace-pre-line text-sm font-mono">{intake.comparativeValueTable}</p>
              </div>
            )}
            {intake.metaTitle && (
              <div>
                <p className="text-sm font-medium text-slate-500">Meta Title</p>
                <p className="text-slate-900 mt-1">{intake.metaTitle}</p>
              </div>
            )}
            {intake.metaDescription && (
              <div>
                <p className="text-sm font-medium text-slate-500">Meta Description</p>
                <p className="text-slate-900 mt-1">{intake.metaDescription}</p>
              </div>
            )}
            {intake.jsonLdSchema && (
              <div>
                <p className="text-sm font-medium text-slate-500">JSON-LD Schema</p>
                <pre className="text-xs bg-slate-50 p-3 rounded mt-1 overflow-x-auto">{intake.jsonLdSchema}</pre>
              </div>
            )}
            {intake.internalLinks && (
              <div>
                <p className="text-sm font-medium text-slate-500">Internal Links</p>
                <p className="text-slate-900 mt-1">{intake.internalLinks}</p>
              </div>
            )}
            {intake.externalCitations && (
              <div>
                <p className="text-sm font-medium text-slate-500">External Citations</p>
                <p className="text-slate-900 mt-1">{intake.externalCitations}</p>
              </div>
            )}
            {intake.schemaElementsIncluded && (
              <div>
                <p className="text-sm font-medium text-slate-500">Schema Elements Included</p>
                <p className="text-slate-900 mt-1">{intake.schemaElementsIncluded}</p>
              </div>
            )}
            {intake.aiDiscoveryTier && (
              <div>
                <p className="text-sm font-medium text-slate-500">AI Discovery Tier</p>
                <Badge className="mt-1 bg-purple-100 text-purple-700">{intake.aiDiscoveryTier}</Badge>
              </div>
            )}
            {intake.lastUpdatedDate && (
              <div>
                <p className="text-sm font-medium text-slate-500">Last Updated</p>
                <p className="text-slate-900 mt-1">{intake.lastUpdatedDate}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}