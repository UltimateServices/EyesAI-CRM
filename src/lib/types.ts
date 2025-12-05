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

  // Contact info
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;

  // Business info
  tagline?: string;
  about?: string;
  ai_summary?: string;
  status?: string;
  plan?: string;

  // Feature tags
  tag1?: string;
  tag2?: string;
  tag3?: string;
  tag4?: string;
  pricing_info?: string;

  // Social media & links
  googleMapsUrl?: string;
  yelpUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;

  // Media
  logoUrl?: string;
  mediaGallery?: any[];

  // Webflow sync
  webflowPublished?: boolean;
  webflowSlug?: string;
  lastSyncedAt?: string;

  // Onboarding
  video_script?: {
    scene1?: string;
    scene2?: string;
    scene3?: string;
    scene4?: string;
  };

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface Intake {
  id: string;
  companyId: string;
  organizationId?: string;
  status?: 'draft' | 'complete';
  
  // ROMA-PDF Data (NEW)
  romaData?: any;
  
  // Completion Info (NEW)
  completedAt?: string;
  completedBy?: string;
  
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

export interface MediaItem {
  id: string;
  companyId: string;
  organizationId?: string;

  // File info
  fileName: string;
  fileUrl: string;
  fileType: 'image' | 'video' | 'document';
  fileSize: number;
  mimeType?: string;

  // Client-facing category (simple)
  category: 'logo' | 'photo' | 'video';

  // VA/Worker internal tags (detailed)
  // logo, exterior, interior, team, work-in-action, before-after, equipment, review-graphics
  internalTags?: string[];

  // Status: pending (new), active (VA approved), inactive (client deactivated)
  status: 'pending' | 'active' | 'inactive';

  // Ordering
  priority: number;

  // Upload tracking
  uploadedByType: 'worker' | 'client';
  uploadedById?: string;

  createdAt?: string;
  updatedAt?: string;
}

// Worker internal category options
export const INTERNAL_CATEGORIES = [
  { id: 'logo', label: 'Logo / Branding', color: 'purple' },
  { id: 'exterior', label: 'Exterior', color: 'emerald' },
  { id: 'interior', label: 'Interior', color: 'amber' },
  { id: 'team', label: 'Team / Staff', color: 'blue' },
  { id: 'work-in-action', label: 'Work in Action', color: 'orange' },
  { id: 'before-after', label: 'Before & After', color: 'pink' },
  { id: 'equipment', label: 'Equipment / Fleet', color: 'slate' },
  { id: 'review-graphics', label: 'Review Graphics', color: 'cyan' },
] as const;

export type InternalCategory = typeof INTERNAL_CATEGORIES[number]['id'];

export interface Blog {
  id: string;
  companyId: string;
  organizationId?: string;
  
  // Content
  h1: string;
  h2?: string;
  quickAnswer?: string;
  keyTakeaways?: string[];
  content: string;
  faqs?: Array<{ q: string; a: string }>;
  
  // Media
  selectedImages?: Array<{ url: string; altText: string; position: number }>;
  
  // Reviews
  selectedReviewIds?: string[];
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  seoScore?: number;
  schemaMarkup?: any;
  
  // Author
  authorName?: string;
  authorTitle?: string;
  authorBio?: string;
  
  // Publishing
  status?: 'draft' | 'published';
  publishedUrl?: string;
  publishedAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface ChatConversation {
  id: string;
  organizationId?: string;

  // Visitor info
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorId?: string; // For tracking returning visitors

  // Company association (if they came from a specific company page)
  companyId?: string;

  // Status
  status: 'ai_only' | 'waiting_human' | 'active_human' | 'resolved';

  // Assignment
  assignedVaId?: string;
  assignedVaName?: string;

  // Metadata
  source: 'webflow' | 'client_portal';
  pageUrl?: string;
  userAgent?: string;

  // Timestamps
  lastMessageAt?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;

  // Sender info
  senderType: 'visitor' | 'ai' | 'va';
  senderId?: string; // VA user ID if sender is VA
  senderName?: string;

  // Message content
  messageText: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;

  // Status
  isRead: boolean;
  readAt?: string;

  createdAt?: string;
}