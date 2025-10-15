'use client';

import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Star,
  Award,
  CheckCircle2,
  ExternalLink,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Image,
  MessageSquare,
  Shield,
  TrendingUp
} from 'lucide-react';

interface CompanyOverviewProps {
  company: Company;
  intake: any;
}

export function CompanyOverview({ company, intake }: CompanyOverviewProps) {
  if (!intake) {
    return (
      <Card className="p-12 text-center">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Intake Data Available</h3>
        <p className="text-slate-600 mb-4">
          Complete the intake form to see detailed company information here.
        </p>
      </Card>
    );
  }

  // Safe parsing functions
  const safeParseArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const safeParseObject = (value: any): any => {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return null;
  };

  const renderIfExists = (value: any) => {
    if (!value) return <span className="text-slate-400 text-sm">Not provided</span>;
    if (Array.isArray(value) && value.length === 0) return <span className="text-slate-400 text-sm">Not provided</span>;
    if (typeof value === 'object' && Object.keys(value).length === 0) return <span className="text-slate-400 text-sm">Not provided</span>;
    return value;
  };

  // Parse complex fields safely
  const services = safeParseArray(intake.services);
  const faqs = safeParseArray(intake.faqs);
  const businessHours = safeParseObject(intake.businessHours);
  const reviewLinks = safeParseObject(intake.reviewLinks);

  return (
    <div className="space-y-6">
      {/* Section 2: Contact & Identity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Contact & Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Website</label>
            <div className="flex items-center gap-2 mt-1">
              <Globe className="w-4 h-4 text-slate-400" />
              {company.website ? (
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                  {company.website}
                </a>
              ) : renderIfExists(null)}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Primary Phone</label>
            <div className="flex items-center gap-2 mt-1">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-900">{renderIfExists(intake.officePhone || company.phone)}</span>
            </div>
          </div>
          {intake.alternatePhone && (
            <div>
              <label className="text-sm font-medium text-slate-600">Alternate Phone</label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-900">{intake.alternatePhone}</span>
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-600">Email</label>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-900">{renderIfExists(intake.contactEmail || company.email)}</span>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium text-slate-600">Main Address</label>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-900">{renderIfExists(intake.officeAddress || company.address)}</span>
            </div>
          </div>
          {intake.ownerPrincipal && (
            <div>
              <label className="text-sm font-medium text-slate-600">Owner/Principal</label>
              <p className="text-sm text-slate-900 mt-1">{intake.ownerPrincipal}</p>
            </div>
          )}
          {intake.yearEstablished && (
            <div>
              <label className="text-sm font-medium text-slate-600">Year Established</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-900">{intake.yearEstablished}</span>
              </div>
            </div>
          )}
          {intake.ownershipType && (
            <div>
              <label className="text-sm font-medium text-slate-600">Ownership Type</label>
              <p className="text-sm text-slate-900 mt-1">{intake.ownershipType}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Section 3: Service Area / Coverage */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Service Area / Coverage
        </h3>
        <div className="space-y-4">
          {intake.primaryFocus && (
            <div>
              <label className="text-sm font-medium text-slate-600">Primary Focus</label>
              <p className="text-sm text-slate-900 mt-1">{intake.primaryFocus}</p>
            </div>
          )}
          {intake.highlightedTowns && intake.highlightedTowns.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-600">Key Towns/Regions</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {intake.highlightedTowns.map((town: string, idx: number) => (
                  <Badge key={idx} variant="outline">{town}</Badge>
                ))}
              </div>
            </div>
          )}
          {intake.serviceRadius && (
            <div>
              <label className="text-sm font-medium text-slate-600">Service Radius</label>
              <p className="text-sm text-slate-900 mt-1">{intake.serviceRadius}</p>
            </div>
          )}
          {intake.latitude && intake.longitude && (
            <div>
              <label className="text-sm font-medium text-slate-600">Coordinates</label>
              <p className="text-sm text-slate-600 mt-1">
                Lat: {intake.latitude}, Long: {intake.longitude}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Section 4: Business Hours & Availability */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Business Hours & Availability
        </h3>
        <div className="space-y-4">
          {businessHours && (
            <div>
              <label className="text-sm font-medium text-slate-600">Hours of Operation</label>
              <div className="mt-2 space-y-1">
                {Object.entries(businessHours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 capitalize">{day}</span>
                    <span className="text-slate-600">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {intake.responseTime && (
            <div>
              <label className="text-sm font-medium text-slate-600">Response Time</label>
              <p className="text-sm text-slate-900 mt-1">{intake.responseTime}</p>
            </div>
          )}
          {intake.emergencyAvailable && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Emergency/Same-Day Service Available</span>
            </div>
          )}
        </div>
      </Card>

      {/* Section 5: Services / Products */}
      {services.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Services / Products
          </h3>
          <div className="space-y-4">
            {services.map((service: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">{service.name}</h4>
                    {service.category && (
                      <Badge variant="outline" className="mt-1">{service.category}</Badge>
                    )}
                  </div>
                  {service.priceRange && (
                    <span className="text-sm font-medium text-slate-700">{service.priceRange}</span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                )}
                {service.timeline && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Timeline:</span> {service.timeline}
                  </p>
                )}
                {service.inclusions && (
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Includes:</span> {service.inclusions}
                  </p>
                )}
                {service.notes && (
                  <p className="text-sm text-slate-500 italic mt-2">{service.notes}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section 6: Reviews & Reputation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-blue-600" />
          Reviews & Reputation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              <span className="text-2xl font-bold text-slate-900">
                {intake.verifiedFiveStarTotal || 0}
              </span>
            </div>
            <p className="text-sm text-slate-600">Verified 5-Star Reviews</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">
                {intake.googleReviewsTotal || 0}
              </span>
            </div>
            <p className="text-sm text-slate-600">Google Reviews</p>
          </div>
        </div>
        {reviewLinks && (
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-600 mb-2 block">Review Links</label>
            <div className="flex flex-wrap gap-2">
              {reviewLinks.google && (
                <Button variant="outline" size="sm" asChild>
                  <a href={reviewLinks.google} target="_blank" rel="noopener noreferrer">
                    Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              )}
              {reviewLinks.yelp && (
                <Button variant="outline" size="sm" asChild>
                  <a href={reviewLinks.yelp} target="_blank" rel="noopener noreferrer">
                    Yelp <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              )}
              {reviewLinks.facebook && (
                <Button variant="outline" size="sm" asChild>
                  <a href={reviewLinks.facebook} target="_blank" rel="noopener noreferrer">
                    Facebook <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              )}
              {reviewLinks.bbb && (
                <Button variant="outline" size="sm" asChild>
                  <a href={reviewLinks.bbb} target="_blank" rel="noopener noreferrer">
                    BBB <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
        {intake.reviewNotes && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">{intake.reviewNotes}</p>
          </div>
        )}
      </Card>

      {/* Section 7: Key Metrics & Badges */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Key Metrics & Badges
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {intake.yearsInBusiness && (
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{intake.yearsInBusiness}</div>
                <div className="text-xs text-slate-600 mt-1">Years in Business</div>
              </div>
            )}
            {intake.projectVolume && (
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm font-bold text-blue-600">{intake.projectVolume}</div>
                <div className="text-xs text-slate-600 mt-1">Project Volume</div>
              </div>
            )}
          </div>
          
          {intake.licensesCertifications && intake.licensesCertifications.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Licenses & Certifications</label>
              <div className="flex flex-wrap gap-2">
                {intake.licensesCertifications.map((cert: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="gap-1">
                    <Shield className="w-3 h-3" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {intake.warrantyInfo && (
            <div>
              <label className="text-sm font-medium text-slate-600">Warranty/Guarantee</label>
              <p className="text-sm text-slate-900 mt-1">{intake.warrantyInfo}</p>
            </div>
          )}
          
          {intake.autoKeywords && intake.autoKeywords.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Top SEO Keywords</label>
              <div className="flex flex-wrap gap-2">
                {intake.autoKeywords.map((keyword: string, idx: number) => (
                  <Badge key={idx} variant="secondary">{keyword}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {intake.badges && intake.badges.length > 0 && (
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Badges & Recognition</label>
              <div className="flex flex-wrap gap-2">
                {intake.badges.map((badge: string, idx: number) => (
                  <Badge key={idx} className="gap-1 bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Section 8: Social & Media Links */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Instagram className="w-5 h-5 text-blue-600" />
          Social & Media Links
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {intake.instagramUrl && (
            <Button variant="outline" className="gap-2 justify-start" asChild>
              <a href={intake.instagramUrl} target="_blank" rel="noopener noreferrer">
                <Instagram className="w-4 h-4" />
                Instagram
              </a>
            </Button>
          )}
          {intake.facebookUrl && (
            <Button variant="outline" className="gap-2 justify-start" asChild>
              <a href={intake.facebookUrl} target="_blank" rel="noopener noreferrer">
                <Facebook className="w-4 h-4" />
                Facebook
              </a>
            </Button>
          )}
          {intake.youtubeUrl && (
            <Button variant="outline" className="gap-2 justify-start" asChild>
              <a href={intake.youtubeUrl} target="_blank" rel="noopener noreferrer">
                <Youtube className="w-4 h-4" />
                YouTube
              </a>
            </Button>
          )}
          {intake.linkedinUrl && (
            <Button variant="outline" className="gap-2 justify-start" asChild>
              <a href={intake.linkedinUrl} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            </Button>
          )}
          {intake.tiktokUrl && (
            <Button variant="outline" className="gap-2 justify-start" asChild>
              <a href={intake.tiktokUrl} target="_blank" rel="noopener noreferrer">
                <span className="font-bold">TT</span>
                TikTok
              </a>
            </Button>
          )}
        </div>
        {(intake.galleryLinks && intake.galleryLinks.length > 0) || (intake.pressLinks && intake.pressLinks.length > 0) && (
          <div className="mt-4 space-y-2">
            {intake.galleryLinks && intake.galleryLinks.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">Gallery Links</label>
                <div className="flex flex-wrap gap-2">
                  {intake.galleryLinks.map((link: string, idx: number) => (
                    <Button key={idx} variant="outline" size="sm" asChild>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        Gallery {idx + 1} <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {intake.pressLinks && intake.pressLinks.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">Press/Affiliations</label>
                <div className="flex flex-wrap gap-2">
                  {intake.pressLinks.map((link: string, idx: number) => (
                    <Button key={idx} variant="outline" size="sm" asChild>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        Link {idx + 1} <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Section 9: Visual Gallery / Media */}
      {((intake.beforeAfterImages && intake.beforeAfterImages.length > 0) || 
        (intake.projectGallery && intake.projectGallery.length > 0) || 
        (intake.embeddedVideos && intake.embeddedVideos.length > 0)) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-blue-600" />
            Visual Gallery / Media
          </h3>
          <div className="space-y-4">
            {intake.beforeAfterImages && intake.beforeAfterImages.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Before/After Images</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {intake.beforeAfterImages.slice(0, 8).map((img: string, idx: number) => (
                    <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img src={img} alt={`Before/After ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {intake.projectGallery && intake.projectGallery.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Project Gallery</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {intake.projectGallery.slice(0, 8).map((img: string, idx: number) => (
                    <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                      <img src={img} alt={`Project ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {intake.embeddedVideos && intake.embeddedVideos.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Videos</label>
                <div className="flex flex-wrap gap-2">
                  {intake.embeddedVideos.map((video: string, idx: number) => (
                    <Button key={idx} variant="outline" size="sm" asChild>
                      <a href={video} target="_blank" rel="noopener noreferrer">
                        <Youtube className="w-4 h-4 mr-1" />
                        Video {idx + 1}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Section 10: FAQs */}
      {faqs.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {faqs.map((faq: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2">Q{idx + 1}: {faq.question}</h4>
                <p className="text-sm text-slate-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section 11: Change Log / Confidence Notes */}
      {(intake.gbpVerificationStatus || intake.dataGaps) && (
        <Card className="p-6 bg-amber-50 border-amber-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600" />
            Data Confidence & Change Log
          </h3>
          <div className="space-y-3">
            {intake.gbpVerificationStatus && (
              <div>
                <label className="text-sm font-medium text-slate-700">GBP Verification Status</label>
                <p className="text-sm text-slate-600 mt-1">{intake.gbpVerificationStatus}</p>
              </div>
            )}
            {intake.dataGaps && (
              <div>
                <label className="text-sm font-medium text-slate-700">Data Gaps/Assumptions</label>
                <p className="text-sm text-slate-600 mt-1">{intake.dataGaps}</p>
              </div>
            )}
            {intake.lastDataUpdate && (
              <div>
                <label className="text-sm font-medium text-slate-700">Last Updated</label>
                <p className="text-sm text-slate-600 mt-1">
                  {new Date(intake.lastDataUpdate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Section 12: SEO & Metadata Block */}
      {(intake.metaTitle || intake.metaDescription || intake.aiDiscoveryTier) && (
        <Card className="p-6 bg-purple-50 border-purple-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            SEO & Metadata
          </h3>
          <div className="space-y-3">
            {intake.metaTitle && (
              <div>
                <label className="text-sm font-medium text-slate-700">Meta Title</label>
                <p className="text-sm text-slate-900 mt-1 font-mono bg-white p-2 rounded border border-purple-200">
                  {intake.metaTitle}
                </p>
              </div>
            )}
            {intake.metaDescription && (
              <div>
                <label className="text-sm font-medium text-slate-700">Meta Description</label>
                <p className="text-sm text-slate-900 mt-1 font-mono bg-white p-2 rounded border border-purple-200">
                  {intake.metaDescription}
                </p>
              </div>
            )}
            {intake.schemaElements && intake.schemaElements.length > 0 && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Schema Elements Included</label>
                <div className="flex flex-wrap gap-2">
                  {intake.schemaElements.map((schema: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-purple-700 border-purple-300">
                      {schema}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {intake.aiDiscoveryTier && (
              <div>
                <label className="text-sm font-medium text-slate-700">AI Discovery Tier</label>
                <Badge className={
                  intake.aiDiscoveryTier === 'Premium' ? 'bg-purple-600 text-white mt-2' :
                  intake.aiDiscoveryTier === 'Verified' ? 'bg-green-600 text-white mt-2' :
                  'bg-slate-600 text-white mt-2'
                }>
                  {intake.aiDiscoveryTier}
                </Badge>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}