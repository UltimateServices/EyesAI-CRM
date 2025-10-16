export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  email?: string;
  role: 'admin' | 'manager' | 'va';
  createdAt?: string;
}

export interface Company {
  id: string;
  organizationId?: string;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  status?: string;
  plan?: string;
  googleMapsUrl?: string;
  yelpUrl?: string;
  facebookUrl?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Intake {
  id: string;
  companyId: string;
  organizationId?: string;
  
  // Basic Info
  legalName?: string;
  displayName?: string;
  tagline?: string;
  industryCategory?: string;
  yearEstablished?: string;
  ownerPrincipal?: string;
  ownershipType?: string;
  verificationTier?: string;
  businessStatus?: string;
  shortDescription?: string;
  
  // Contact
  officePhone?: string;
  alternatePhone?: string;
  contactEmail?: string;
  officeAddress?: string;
  
  // Geo
  latitude?: number;
  longitude?: number;
  
  // Service Area
  primaryFocus?: string;
  highlightedTowns?: string[];
  serviceRadius?: string;
  
  // Hours
  businessHours?: any;
  responseTime?: string;
  emergencyAvailable?: boolean;
  
  // Services
  services?: any[];
  
  // Reviews
  verifiedFiveStarTotal?: number;
  googleReviewsTotal?: number;
  reviewLinks?: any;
  reviewNotes?: string;
  
  // Metrics
  yearsInBusiness?: number;
  licensesCertifications?: string[];
  warrantyInfo?: string;
  projectVolume?: string;
  autoKeywords?: string[];
  badges?: string[];
  
  // Social
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  tiktokUrl?: string;
  galleryLinks?: string[];
  pressLinks?: string[];
  
  // Gallery
  beforeAfterImages?: string[];
  projectGallery?: string[];
  embeddedVideos?: string[];
  
  // FAQs
  faqs?: any[];
  
  // Change Log
  gbpVerificationStatus?: string;
  dataGaps?: string;
  lastDataUpdate?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  structuredData?: any;
  schemaElements?: string[];
  aiDiscoveryTier?: string;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  companyId: string;
  organizationId?: string;
  author?: string;
  rating?: number;
  text?: string;
  date?: string;
  platform?: string;
  url?: string;
  createdAt?: string;
}

export interface Task {
  id: string;
  companyId: string;
  organizationId?: string;
  userId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
}