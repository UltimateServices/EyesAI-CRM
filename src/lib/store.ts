import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

interface Company {
  id: string;
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
  logoUrl?: string;  // ADDED
  createdAt?: string;
  updatedAt?: string;
}

interface Intake {
  id: string;
  companyId: string;
  
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

interface Review {
  id: string;
  companyId: string;
  author?: string;
  rating?: number;
  text?: string;
  date?: string;
  platform?: string;
  url?: string;
  createdAt?: string;
}

interface Task {
  id: string;
  companyId: string;
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

interface StoreState {
  companies: Company[];
  intakes: Intake[];
  reviews: Review[];
  tasks: Task[];
  
  // Company methods
  fetchCompanies: () => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  
  // Intake methods
  fetchIntakes: () => Promise<void>;
  getIntakeByCompanyId: (companyId: string) => Intake | undefined;
  saveIntake: (intake: any) => Promise<void>;

  // Review methods
  fetchReviews: () => Promise<void>;
  addReview: (review: any) => Promise<void>;
  addReviews: (companyId: string, reviews: Omit<Review, 'id' | 'companyId' | 'createdAt'>[]) => Promise<void>;

  // Task methods
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  companies: [],
  intakes: [],
  reviews: [],
  tasks: [],

  // ===== COMPANIES =====
  fetchCompanies: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const companies: Company[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        website: row.website,
        phone: row.phone,
        email: row.email,
        address: row.address,
        city: row.city,
        state: row.state,
        zip: row.zip,
        status: row.status,
        plan: row.plan,
        googleMapsUrl: row.google_maps_url,
        yelpUrl: row.yelp_url,
        facebookUrl: row.facebook_url,
        logoUrl: row.logo_url,  // ADDED
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      set({ companies });
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  },

  addCompany: async (company) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('companies')
        .insert([{
          user_id: user.id,
          name: company.name,
          website: company.website,
          phone: company.phone,
          email: company.email,
          address: company.address,
          city: company.city,
          state: company.state,
          zip: company.zip,
          status: company.status || 'active',
          plan: company.plan,
          google_maps_url: company.googleMapsUrl,
          yelp_url: company.yelpUrl,
          facebook_url: company.facebookUrl,
          logo_url: company.logoUrl,  // ADDED
        }]);

      if (error) throw error;
      await get().fetchCompanies();
    } catch (error) {
      console.error('Error adding company:', error);
    }
  },

  updateCompany: async (id, updates) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are provided
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.website !== undefined) updateData.website = updates.website;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.state !== undefined) updateData.state = updates.state;
      if (updates.zip !== undefined) updateData.zip = updates.zip;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.plan !== undefined) updateData.plan = updates.plan;
      if (updates.googleMapsUrl !== undefined) updateData.google_maps_url = updates.googleMapsUrl;
      if (updates.yelpUrl !== undefined) updateData.yelp_url = updates.yelpUrl;
      if (updates.facebookUrl !== undefined) updateData.facebook_url = updates.facebookUrl;
      if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;  // ADDED

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      await get().fetchCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },

  deleteCompany: async (id) => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  },

  // ===== INTAKES =====
  fetchIntakes: async () => {
    try {
      const { data, error } = await supabase
        .from('intakes')
        .select('*');

      if (error) throw error;

      const intakes: Intake[] = (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        
        // Basic Info
        legalName: row.legal_name,
        displayName: row.display_name,
        tagline: row.tagline,
        industryCategory: row.industry_category,
        yearEstablished: row.year_established,
        ownerPrincipal: row.owner_principal,
        ownershipType: row.ownership_type,
        verificationTier: row.verification_tier,
        businessStatus: row.business_status,
        shortDescription: row.short_description,
        
        // Contact
        officePhone: row.office_phone,
        alternatePhone: row.alternate_phone,
        contactEmail: row.contact_email,
        officeAddress: row.office_address,
        
        // Geo
        latitude: row.latitude,
        longitude: row.longitude,
        
        // Service Area
        primaryFocus: row.primary_focus,
        highlightedTowns: row.highlighted_towns,
        serviceRadius: row.service_radius,
        
        // Hours
        businessHours: row.business_hours,
        responseTime: row.response_time,
        emergencyAvailable: row.emergency_available,
        
        // Services
        services: row.services,
        
        // Reviews
        verifiedFiveStarTotal: row.verified_five_star_total,
        googleReviewsTotal: row.google_reviews_total,
        reviewLinks: row.review_links,
        reviewNotes: row.review_notes,
        
        // Metrics
        yearsInBusiness: row.years_in_business,
        licensesCertifications: row.licenses_certifications,
        warrantyInfo: row.warranty_info,
        projectVolume: row.project_volume,
        autoKeywords: row.auto_keywords,
        badges: row.badges,
        
        // Social
        instagramUrl: row.instagram_url,
        facebookUrl: row.facebook_url,
        youtubeUrl: row.youtube_url,
        linkedinUrl: row.linkedin_url,
        tiktokUrl: row.tiktok_url,
        galleryLinks: row.gallery_links,
        pressLinks: row.press_links,
        
        // Gallery
        beforeAfterImages: row.before_after_images,
        projectGallery: row.project_gallery,
        embeddedVideos: row.embedded_videos,
        
        // FAQs
        faqs: row.faqs,
        
        // Change Log
        gbpVerificationStatus: row.gbp_verification_status,
        dataGaps: row.data_gaps,
        lastDataUpdate: row.last_data_update,
        
        // SEO
        metaTitle: row.meta_title,
        metaDescription: row.meta_description,
        structuredData: row.structured_data,
        schemaElements: row.schema_elements,
        aiDiscoveryTier: row.ai_discovery_tier,
        
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      set({ intakes });
    } catch (error) {
      console.error('Error fetching intakes:', error);
    }
  },

  getIntakeByCompanyId: (companyId) => {
    return get().intakes.find((i) => i.companyId === companyId);
  },

  saveIntake: async (intake) => {
    try {
      // Check if intake exists
      const { data: existing } = await supabase
        .from('intakes')
        .select('id')
        .eq('company_id', intake.companyId)
        .single();

      const intakeData = {
        company_id: intake.companyId,
        
        // Basic Info
        legal_name: intake.legalName,
        display_name: intake.displayName,
        tagline: intake.tagline,
        industry_category: intake.industryCategory,
        year_established: intake.yearEstablished,
        owner_principal: intake.ownerPrincipal,
        ownership_type: intake.ownershipType,
        verification_tier: intake.verificationTier,
        business_status: intake.businessStatus,
        short_description: intake.shortDescription,
        
        // Contact
        office_phone: intake.officePhone,
        alternate_phone: intake.alternatePhone,
        contact_email: intake.contactEmail,
        office_address: intake.officeAddress,
        
        // Geo
        latitude: intake.latitude,
        longitude: intake.longitude,
        
        // Service Area
        primary_focus: intake.primaryFocus,
        highlighted_towns: intake.highlightedTowns,
        service_radius: intake.serviceRadius,
        
        // Hours
        business_hours: intake.businessHours,
        response_time: intake.responseTime,
        emergency_available: intake.emergencyAvailable,
        
        // Services
        services: intake.services,
        
        // Reviews
        verified_five_star_total: intake.verifiedFiveStarTotal,
        google_reviews_total: intake.googleReviewsTotal,
        review_links: intake.reviewLinks,
        review_notes: intake.reviewNotes,
        
        // Metrics
        years_in_business: intake.yearsInBusiness,
        licenses_certifications: intake.licensesCertifications,
        warranty_info: intake.warrantyInfo,
        project_volume: intake.projectVolume,
        auto_keywords: intake.autoKeywords,
        badges: intake.badges,
        
        // Social
        instagram_url: intake.instagramUrl,
        facebook_url: intake.facebookUrl,
        youtube_url: intake.youtubeUrl,
        linkedin_url: intake.linkedinUrl,
        tiktok_url: intake.tiktokUrl,
        gallery_links: intake.galleryLinks,
        press_links: intake.pressLinks,
        
        // Gallery
        before_after_images: intake.beforeAfterImages,
        project_gallery: intake.projectGallery,
        embedded_videos: intake.embeddedVideos,
        
        // FAQs
        faqs: intake.faqs,
        
        // Change Log
        gbp_verification_status: intake.gbpVerificationStatus,
        data_gaps: intake.dataGaps,
        last_data_update: new Date().toISOString(),
        
        // SEO
        meta_title: intake.metaTitle,
        meta_description: intake.metaDescription,
        structured_data: intake.structuredData,
        schema_elements: intake.schemaElements,
        ai_discovery_tier: intake.aiDiscoveryTier,
        
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('intakes')
          .update(intakeData)
          .eq('company_id', intake.companyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('intakes')
          .insert([intakeData]);
        if (error) throw error;
      }

      await get().fetchIntakes();
    } catch (error) {
      console.error('Error saving intake:', error);
      throw error;
    }
  },

  // ===== REVIEWS =====
  fetchReviews: async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviews: Review[] = (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        author: row.author,
        rating: row.rating,
        text: row.text,
        date: row.date,
        platform: row.platform,
        url: row.url,
        createdAt: row.created_at,
      }));

      set({ reviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  },

  addReview: async (review) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          company_id: review.companyId,
          author: review.author,
          rating: review.rating,
          text: review.text,
          date: review.date,
          platform: review.platform,
          url: review.url,
        }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        reviews: [data, ...state.reviews],
      }));
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  addReviews: async (companyId, reviews) => {
    try {
      const reviewData = reviews.map(review => ({
        company_id: companyId,
        author: review.author,
        rating: review.rating,
        text: review.text,
        date: review.date,
        platform: review.platform,
        url: review.url,
      }));

      const { error } = await supabase
        .from('reviews')
        .insert(reviewData);

      if (error) throw error;
      await get().fetchReviews();
    } catch (error) {
      console.error('Error adding reviews:', error);
      throw error;
    }
  },

  // ===== TASKS =====
  fetchTasks: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks: Task[] = (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date,
        assignedTo: row.assigned_to,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      set({ tasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  },

  addTask: async (task) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('tasks')
        .insert([{
          user_id: user.id,
          company_id: task.companyId,
          title: task.title,
          description: task.description,
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          due_date: task.dueDate,
          assigned_to: task.assignedTo,
        }]);

      if (error) throw error;
      await get().fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          due_date: updates.dueDate,
          assigned_to: updates.assignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await get().fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  },
}));

export type { Company, Intake, Review, Task };