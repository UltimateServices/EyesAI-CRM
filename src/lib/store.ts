import { create } from 'zustand';
import { Company, Intake } from './types';
import { supabase } from './supabase';

interface StoreState {
  companies: Company[];
  intakes: Intake[];
  
  // Company methods
  fetchCompanies: () => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  
  // Intake methods
  fetchIntakes: () => Promise<void>;
  getIntakeByCompanyId: (companyId: string) => Intake | undefined;
  saveIntake: (intake: Intake) => Promise<void>;
  updateCompanyFromIntake: (companyId: string, intake: Intake) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  companies: [],
  intakes: [],

  // Fetch all companies from Supabase
  fetchCompanies: async () => {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      return;
    }

    // Map database fields to frontend format
    const companies: Company[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      website: row.website || '',
      logoUrl: row.logo_url || '',
      contactEmail: row.contact_email || '',
      phone: row.phone || '',
      address: row.address || '',
      status: row.status,
      plan: row.plan,
      assignedVaName: row.assigned_va_name || '',
      createdAt: row.created_at,
      lastUpdated: row.updated_at,
    }));

    set({ companies });
  },

  // Add new company
  addCompany: async (company) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('companies')
      .insert([{
        name: company.name,
        website: company.website,
        logo_url: company.logoUrl,
        contact_email: company.contactEmail,
        phone: company.phone,
        address: company.address,
        status: company.status,
        plan: company.plan,
        assigned_va_name: company.assignedVaName,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding company:', error);
      return;
    }

    // Refresh companies
    await get().fetchCompanies();
  },

  // Update company
  updateCompany: async (id, updates) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('companies')
      .update({
        name: updates.name,
        website: updates.website,
        logo_url: updates.logoUrl,
        contact_email: updates.contactEmail,
        phone: updates.phone,
        address: updates.address,
        status: updates.status,
        plan: updates.plan,
        assigned_va_name: updates.assignedVaName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating company:', error);
      return;
    }

    // Refresh companies
    await get().fetchCompanies();
  },

  // Delete company
  deleteCompany: async (id) => {
    if (!supabase) return;

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company:', error);
      return;
    }

    // Refresh companies
    await get().fetchCompanies();
  },

  // Fetch all intakes
  fetchIntakes: async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('intakes')
      .select('*');

    if (error) {
      console.error('Error fetching intakes:', error);
      return;
    }

    // Map database to frontend format
    const intakes: Intake[] = (data || []).map((row: any) => ({
      id: row.id,
      companyId: row.company_id,
      status: row.status,
      ...(row.data || {}), // Spread all intake fields from JSON
      galleryImages: row.gallery_images || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    }));

    set({ intakes });
  },

  // Get intake by company ID
  getIntakeByCompanyId: (companyId) => {
    return get().intakes.find((i) => i.companyId === companyId);
  },

  // Save intake
  saveIntake: async (intake) => {
    if (!supabase) return;

    // Check if intake exists
    const { data: existing } = await supabase
      .from('intakes')
      .select('id')
      .eq('company_id', intake.companyId)
      .single();

    const intakeData = {
      company_id: intake.companyId,
      status: intake.status,
      official_name: intake.officialName,
      website: intake.website,
      main_phone: intake.mainPhone,
      physical_address: intake.physicalAddress,
      gallery_images: intake.galleryImages || [],
      data: intake, // Store entire intake as JSON
      updated_at: new Date().toISOString(),
      completed_at: intake.completedAt || null,
    };

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('intakes')
        .update(intakeData)
        .eq('company_id', intake.companyId);

      if (error) {
        console.error('Error updating intake:', error);
        return;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('intakes')
        .insert([intakeData]);

      if (error) {
        console.error('Error inserting intake:', error);
        return;
      }
    }

    // Refresh intakes
    await get().fetchIntakes();
  },

  // Update company from intake data
  updateCompanyFromIntake: async (companyId, intake) => {
    await get().updateCompany(companyId, {
      status: 'ACTIVE',
      website: intake.website || '',
      phone: intake.mainPhone || '',
      address: intake.physicalAddress || '',
    });
  },
}));