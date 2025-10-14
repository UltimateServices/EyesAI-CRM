export interface Company {
  id: string;
  name: string;
  website: string;
  logoUrl?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  status: 'NEW' | 'ACTIVE' | 'CHURNED';
  plan: 'DISCOVER' | 'VERIFIED';
  assignedVaName?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface Intake {
  id: string;
  companyId: string;
  status: 'draft' | 'complete';
  
  // Part 1 - Basic Business Information
  legalCanonicalName?: string;
  alsoKnownAs?: string;
  industryCategoryBadges?: string;
  yearEstablished?: string;
  ownershipHeritage?: string;
  businessStatus?: string;
  taglineSlogan?: string;
  shortDescription?: string;
  verificationTier?: string;
  
  // Part 2 - Contact Information
  officialName?: string;
  website?: string;
  mainPhone?: string;
  physicalAddress?: string;
  onlineOrdering?: string;
  emails?: string | string[];
  canonicalDomain?: string;
  
  // Part 3 - Geolocation Data
  latitudeLongitude?: string;
  geoSource?: string;
  
  // Part 4 - Service Area / Delivery Zone
  localFocus?: string;
  primaryNearbyTowns?: string;
  
  // Part 5 - Business Hours & Availability
  businessHours?: string;
  responseTime?: string;
  
  // Part 6 - Services / Products Offered
  servicesOffered?: string;
  
  // Part 7 - Reviews & Reputation
  verifiedFiveStarTotal?: string;
  googleReviewsTotal?: string;
  reviewLinks?: string;
  yelpInfo?: string;
  facebookInfo?: string;
  tripadvisorInfo?: string;
  directProfiles?: string;
  
  // NEW: Dedicated Google Maps Link Fields
  googleMapsLink1?: string;
  googleMapsLink2?: string;
  googleMapsLink3?: string;
  googleMapsLink4?: string;
  googleMapsLink5?: string;
  
  // Part 8 - Key Metrics & Differentiators
  quickFacts?: string;
  primarySeoKeywords?: string;
  verifiedFallbackBadges?: string;
  
  // Part 9 - Social Media & Media Links
  socialMediaLinks?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  galleryUrl?: string;
  recipesUrl?: string;
  
  // Part 10 - Visual Assets / Gallery
  visualAssets?: string;
  logoUrl?: string;
  galleryImages?: string[];
  
  // Part 11 - FAQs
  faqs?: string;
  
  // Additional Sections
  changeLogConfidenceGaps?: string;
  seoSummary?: string;
  comparativeValueTable?: string;
  metaTitle?: string;
  metaDescription?: string;
  jsonLdSchema?: string;
  internalLinks?: string;
  externalCitations?: string;
  schemaElementsIncluded?: string;
  aiDiscoveryTier?: string;
  lastUpdatedDate?: string;
  
  // Reviews
  reviews?: Review[];
  
  // Legacy fields
  category?: string;
  founded?: string;
  licenses?: string;
  serviceAreas?: string[];
  shortBlurb?: string;
  fullAbout?: string;
  missionStatement?: string;
  videoLinks?: string[];
  services?: Array<{ name: string; description: string; price?: string }>;
  socialProfiles?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  directories?: {
    googleBusinessFound?: boolean;
    yelpFound?: boolean;
    bbbFound?: boolean;
    linkedinFound?: boolean;
  };
  metaKeywords?: string;
  h1Tag?: string;
  schemaDetected?: boolean;
  schemaType?: string;
  platform?: string;
  sslEnabled?: boolean;
  mobileFriendly?: boolean;
  mapLink?: string;
  heroImageUrl?: string;
  notes?: string;
  verificationLog?: VerificationLogEntry[];
  lastVerified?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
}

export interface Review {
  id: string;
  companyId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  reviewerName: string;
  reviewText: string;
  date: string;
  platform: 'Google' | 'Yelp' | 'Facebook' | 'TripAdvisor' | 'Other';
  reviewUrl?: string;
  source: 'manual' | 'intake';
  createdAt: string;
}

export interface VerificationLogEntry {
  id: string;
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
  source: string;
  changeType: 'verified' | 'updated' | 'added';
}

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}