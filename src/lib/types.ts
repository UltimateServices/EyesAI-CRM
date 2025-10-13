export type CompanyStatus = 'NEW' | 'ACTIVE' | 'CHURNED';
export type CompanyPlan = 'DISCOVER' | 'VERIFIED';

export interface Company {
  id: string;
  name: string;
  website: string;
  logoUrl?: string;
  coverUrl?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  status: CompanyStatus;
  plan: CompanyPlan;
  assignedVaName?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationLogEntry {
  id: string;
  timestamp: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  source: string;
  changeType: 'added' | 'updated' | 'verified' | 'removed';
}

export interface Intake {
  id: string;
  companyId: string;
  status: 'draft' | 'complete';
  
  // Company Identity
  officialName?: string;
  category?: string;
  founded?: string;
  businessHours?: string;
  licenses?: string;
  
  // Contact & Location
  mainPhone?: string;
  emails?: string[];
  physicalAddress?: string;
  serviceAreas?: string[];
  mapLink?: string;
  
  // Services
  services?: Array<{
    name: string;
    description: string;
    price?: string;
  }>;
  
  // Media
  logoUrl?: string;
  heroImageUrl?: string;
  galleryImages?: string[];
  videoLinks?: string[];
  
  // About
  shortBlurb?: string;
  fullAbout?: string;
  missionStatement?: string;
  
  // Online Presence
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
  
  // SEO & Meta
  metaTitle?: string;
  metaDescription?: string;
  h1Tag?: string;
  schemaDetected?: boolean;
  schemaType?: string;
  
  // Technical
  platform?: string;
  sslEnabled?: boolean;
  mobileFriendly?: boolean;
  
  // VA Notes
  notes?: string;
  
  // Completion
  completedAt?: string;
  completedBy?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Verification
  lastVerified?: string;
  verificationLog?: VerificationLogEntry[];
}