import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Organization, OrganizationMember, Company, Intake, Review, Task } from './types';

const supabase = createClientComponentClient();

interface StoreState {
  // Organization state
  currentOrganization: Organization | null;
  organizationMembers: OrganizationMember[];
  currentUserRole: 'admin' | 'manager' | 'va' | null;
  
  // Data state
  companies: Company[];
  intakes: Intake[];
  reviews: Review[];
  tasks: Task[];
  
  // Organization methods
  initializeOrganization: () => Promise<void>;
  fetchOrganizationMembers: () => Promise<void>;
  addOrganizationMember: (email: string, role: 'admin' | 'manager' | 'va') => Promise<void>;
  updateMemberRole: (memberId: string, role: 'admin' | 'manager' | 'va') => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  
  // Company methods
  fetchCompanies: () => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  
  // Intake methods
  fetchIntakes: () => Promise<void>;
  getIntakeByCompanyId: (companyId: string) => Intake | undefined;
  saveIntake: (intake: any) => Promise<void>;
  updateCompanyFromIntake: (companyId: string, intake: Intake) => Promise<void>;

  // Review methods
  fetchReviews: () => Promise<void>;
  addReview: (review: any) => Promise<void>;
  addReviews: (companyId: string, reviews: Omit<Review, 'id' | 'companyId' | 'createdAt' | 'organizationId'>[]) => Promise<void>;

  // Task methods
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Media methods
  uploadCompanyMedia: (companyId: string, imageUrl: string, alt: string) => Promise<void>;
  deleteCompanyMedia: (companyId: string, imageId: string) => Promise<void>;
  updateCompanyLogo: (companyId: string, logoUrl: string) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  currentOrganization: null,
  organizationMembers: [],
  currentUserRole: null,
  companies: [],
  intakes: [],
  reviews: [],
  tasks: [],

  // ===== ORGANIZATION =====
  initializeOrganization: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is member of an organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        // User is already in an organization
        set({
          currentOrganization: {
            id: membership.organizations.id,
            name: membership.organizations.name,
            ownerId: membership.organizations.owner_id,
            createdAt: membership.organizations.created_at,
            updatedAt: membership.organizations.updated_at,
          },
          currentUserRole: membership.role,
        });
      } else {
        // Create new organization for this user
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert([{
            name: `${user.email}'s Organization`,
            owner_id: user.id,
          }])
          .select()
          .single();

        if (orgError) throw orgError;

        // Add user as admin member
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert([{
            organization_id: newOrg.id,
            user_id: user.id,
            email: user.email,
            role: 'admin',
          }]);

        if (memberError) throw memberError;

        set({
          currentOrganization: {
            id: newOrg.id,
            name: newOrg.name,
            ownerId: newOrg.owner_id,
            createdAt: newOrg.created_at,
            updatedAt: newOrg.updated_at,
          },
          currentUserRole: 'admin',
        });
      }

      // Fetch members
      await get().fetchOrganizationMembers();
    } catch (error) {
      console.error('Error initializing organization:', error);
    }
  },

  fetchOrganizationMembers: async () => {
    try {
      const { currentOrganization } = get();
      if (!currentOrganization) return;

      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      const members: OrganizationMember[] = (data || []).map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
        userId: row.user_id,
        email: row.email,
        role: row.role,
        createdAt: row.created_at,
      }));

      set({ organizationMembers: members });
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  },

  addOrganizationMember: async (email: string, role: 'admin' | 'manager' | 'va') => {
    try {
      const { currentOrganization, currentUserRole } = get();
      if (!currentOrganization || !['admin', 'manager'].includes(currentUserRole || '')) {
        throw new Error('Not authorized to add members');
      }

      // Check if user exists in auth
      const { data: userData } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();

      const userId = userData?.id || null;

      // Add member
      const { error } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: currentOrganization.id,
          user_id: userId,
          email: email,
          role: role,
        }]);

      if (error) throw error;

      await get().fetchOrganizationMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  },

  updateMemberRole: async (memberId: string, role: 'admin' | 'manager' | 'va') => {
    try {
      const { currentUserRole } = get();
      if (!['admin', 'manager'].includes(currentUserRole || '')) {
        throw new Error('Not authorized to update members');
      }

      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;

      await get().fetchOrganizationMembers();
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  removeMember: async (memberId: string) => {
    try {
      const { currentUserRole } = get();
      if (!['admin', 'manager'].includes(currentUserRole || '')) {
        throw new Error('Not authorized to remove members');
      }

      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await get().fetchOrganizationMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  // ===== COMPANIES =====
  fetchCompanies: async () => {
    try {
      const { currentOrganization } = get();
      if (!currentOrganization) return;

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const companies: Company[] = (data || []).map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
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
        logoUrl: row.logo_url,
        media: {
          logo: row.logo_url,
          gallery: row.media_gallery || [],
        },
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
      const { currentOrganization } = get();
      if (!currentOrganization) throw new Error('No organization found');

      const { error } = await supabase
        .from('companies')
        .insert([{
          organization_id: currentOrganization.id,
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
          logo_url: company.logoUrl,
        }]);

      if (error) throw error;
      await get().fetchCompanies();
    } catch (error) {
      console.error('Error adding company:', error);
      throw error;
    }
  },

  updateCompany: async (id, updates) => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

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
      if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;

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
      const { currentUserRole } = get();
      if (!['admin', 'manager'].includes(currentUserRole || '')) {
        throw new Error('Not authorized to delete companies');
      }

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  },

  // ===== INTAKES =====
  fetchIntakes: async () => {
    try {
      const { currentOrganization } = get();
      if (!currentOrganization) return;

      const { data, error } = await supabase
        .from('intakes')
        .select('*, companies!inner(organization_id)')
        .eq('companies.organization_id', currentOrganization.id);

      if (error) throw error;

      const intakes: Intake[] = (data || []).map((row: any) => ({
        id: row.id,
        companyId: row.company_id,
        status: row.status,
        romaData: row.roma_data,
        completedAt: row.completed_at,
        completedBy: row.completed_by,
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
        officePhone: row.office_phone,
        alternatePhone: row.alternate_phone,
        contactEmail: row.contact_email,
        officeAddress: row.office_address,
        latitude: row.latitude,
        longitude: row.longitude,
        primaryFocus: row.primary_focus,
        highlightedTowns: row.highlighted_towns,
        serviceRadius: row.service_radius,
        businessHours: row.business_hours,
        responseTime: row.response_time,
        emergencyAvailable: row.emergency_available,
        services: row.services,
        verifiedFiveStarTotal: row.verified_five_star_total,
        googleReviewsTotal: row.google_reviews_total,
        reviewLinks: row.review_links,
        reviewNotes: row.review_notes,
        yearsInBusiness: row.years_in_business,
        licensesCertifications: row.licenses_certifications,
        warrantyInfo: row.warranty_info,
        projectVolume: row.project_volume,
        autoKeywords: row.auto_keywords,
        badges: row.badges,
        instagramUrl: row.instagram_url,
        facebookUrl: row.facebook_url,
        youtubeUrl: row.youtube_url,
        linkedinUrl: row.linkedin_url,
        tiktokUrl: row.tiktok_url,
        galleryLinks: row.gallery_links,
        pressLinks: row.press_links,
        beforeAfterImages: row.before_after_images,
        projectGallery: row.project_gallery,
        embeddedVideos: row.embedded_videos,
        faqs: row.faqs,
        gbpVerificationStatus: row.gbp_verification_status,
        dataGaps: row.data_gaps,
        lastDataUpdate: row.last_data_update,
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
      const { data: existing } = await supabase
        .from('intakes')
        .select('id')
        .eq('company_id', intake.companyId)
        .single();

      const intakeData = {
        company_id: intake.companyId,
        status: intake.status || 'draft',
        roma_data: intake.romaData || null,
        completed_at: intake.completedAt || null,
        completed_by: intake.completedBy || null,
        // Keep all the old fields for backwards compatibility
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
        office_phone: intake.officePhone,
        alternate_phone: intake.alternatePhone,
        contact_email: intake.contactEmail,
        office_address: intake.officeAddress,
        latitude: intake.latitude,
        longitude: intake.longitude,
        primary_focus: intake.primaryFocus,
        highlighted_towns: intake.highlightedTowns,
        service_radius: intake.serviceRadius,
        business_hours: intake.businessHours,
        response_time: intake.responseTime,
        emergency_available: intake.emergencyAvailable,
        services: intake.services,
        verified_five_star_total: intake.verifiedFiveStarTotal,
        google_reviews_total: intake.googleReviewsTotal,
        review_links: intake.reviewLinks,
        review_notes: intake.reviewNotes,
        years_in_business: intake.yearsInBusiness,
        licenses_certifications: intake.licensesCertifications,
        warranty_info: intake.warrantyInfo,
        project_volume: intake.projectVolume,
        auto_keywords: intake.autoKeywords,
        badges: intake.badges,
        instagram_url: intake.instagramUrl,
        facebook_url: intake.facebookUrl,
        youtube_url: intake.youtubeUrl,
        linkedin_url: intake.linkedinUrl,
        tiktok_url: intake.tiktokUrl,
        gallery_links: intake.galleryLinks,
        press_links: intake.pressLinks,
        before_after_images: intake.beforeAfterImages,
        project_gallery: intake.projectGallery,
        embedded_videos: intake.embeddedVideos,
        faqs: intake.faqs,
        gbp_verification_status: intake.gbpVerificationStatus,
        data_gaps: intake.dataGaps,
        last_data_update: new Date().toISOString(),
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

  updateCompanyFromIntake: async (companyId: string, intake: Intake) => {
    try {
      // Update company status to active when intake is complete
      if (intake.status === 'complete') {
        await get().updateCompany(companyId, { status: 'active' });
      }
    } catch (error) {
      console.error('Error updating company from intake:', error);
      throw error;
    }
  },

  // ===== REVIEWS =====
  fetchReviews: async () => {
    try {
      const { currentOrganization } = get();
      if (!currentOrganization) return;

      const { data, error } = await supabase
        .from('reviews')
        .select('*, companies!inner(organization_id)')
        .eq('companies.organization_id', currentOrganization.id)
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
      const { currentOrganization } = get();
      if (!currentOrganization) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*, companies!inner(organization_id)')
        .eq('companies.organization_id', currentOrganization.id)
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

  // ===== MEDIA =====
  uploadCompanyMedia: async (companyId, imageUrl, alt) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get current company data
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('media_gallery')
        .eq('id', companyId)
        .single();

      if (fetchError) throw fetchError;

      // Parse existing gallery or create new array
      const currentGallery = company?.media_gallery || [];
      
      // Add new image
      const newImage = {
        id: `img-${Date.now()}`,
        url: imageUrl,
        alt: alt,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.email || 'Unknown',
      };

      const updatedGallery = [...currentGallery, newImage];

      // Update database
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          media_gallery: updatedGallery,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Refresh companies
      await get().fetchCompanies();
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  },

  deleteCompanyMedia: async (companyId, imageId) => {
    try {
      // Get current company data
      const { data: company, error: fetchError } = await supabase
        .from('companies')
        .select('media_gallery')
        .eq('id', companyId)
        .single();

      if (fetchError) throw fetchError;

      // Remove image from gallery
      const currentGallery = company?.media_gallery || [];
      const updatedGallery = currentGallery.filter((img: any) => img.id !== imageId);

      // Update database
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          media_gallery: updatedGallery,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Refresh companies
      await get().fetchCompanies();
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  },

  updateCompanyLogo: async (companyId, logoUrl) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      if (error) throw error;

      // Refresh companies
      await get().fetchCompanies();
    } catch (error) {
      console.error('Error updating logo:', error);
      throw error;
    }
  },
}));