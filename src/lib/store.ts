import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Company, Task, Intake, VerificationLogEntry } from './types';

interface AppState {
  companies: Company[];
  tasks: Task[];
  intakes: Intake[];
  
  addCompany: (company: Company) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  saveIntake: (intake: Intake) => void;
  getIntakeByCompanyId: (companyId: string) => Intake | undefined;
  updateCompanyFromIntake: (companyId: string, intake: Intake) => void;
  
  addVerificationLog: (companyId: string, entry: VerificationLogEntry) => void;
  updateLastVerified: (companyId: string, timestamp: string) => void;
}

const mockCompanies: Company[] = [
  {
    id: 'c1',
    name: 'Ultimate Dumpsters',
    website: 'https://ultimatedumpsters.com',
    logoUrl: '',
    contactEmail: 'CS@UltimateDumpsters.com',
    phone: '(866) 858-3867',
    address: '3391 Long Beach Road, Oceanside NY 11572',
    status: 'ACTIVE',
    plan: 'VERIFIED',
    assignedVaName: 'John VA',
    createdAt: new Date('2025-09-15').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Major Dumpsters Inc.',
    website: 'https://majordumpsters.com',
    logoUrl: '',
    contactEmail: 'Contact@majordumpsters.com',
    phone: '(516) 696-3867',
    address: '3670 W Oceanside Road, Oceanside, New York',
    status: 'ACTIVE',
    plan: 'DISCOVER',
    assignedVaName: 'John VA',
    createdAt: new Date('2025-10-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'c3',
    name: 'Green Waste Solutions',
    website: 'https://greenwaste.example.com',
    contactEmail: 'hello@greenwaste.example.com',
    phone: '(555) 123-4567',
    address: '123 Eco Street, Portland OR 97201',
    status: 'NEW',
    plan: 'DISCOVER',
    assignedVaName: 'Sarah VA',
    createdAt: new Date('2025-10-12').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTasks: Task[] = [
  {
    id: 't1',
    companyId: 'c1',
    title: 'Complete Company Intake',
    description: 'Gather all business information from website',
    status: 'done',
    priority: 'high',
    assignedTo: 'John VA',
    dueAt: new Date('2025-10-05').toISOString(),
    createdAt: new Date('2025-10-01').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't2',
    companyId: 'c2',
    title: 'Verify Business Licenses',
    description: 'Check state licensing database',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'John VA',
    dueAt: new Date('2025-10-15').toISOString(),
    createdAt: new Date('2025-10-10').toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't3',
    companyId: 'c3',
    title: 'Initial Contact',
    description: 'Schedule onboarding call',
    status: 'todo',
    priority: 'high',
    assignedTo: 'Sarah VA',
    dueAt: new Date('2025-10-14').toISOString(),
    createdAt: new Date('2025-10-12').toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      companies: mockCompanies,
      tasks: mockTasks,
      intakes: [],

      addCompany: (company) =>
        set((state) => ({
          companies: [...state.companies, company],
        })),

      updateCompany: (id, updates) =>
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),

      deleteCompany: (id) =>
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      saveIntake: (intake) =>
        set((state) => {
          console.log('saveIntake called with:', intake);
          const existingIndex = state.intakes.findIndex((i) => i.id === intake.id);
          if (existingIndex >= 0) {
            const updated = [...state.intakes];
            updated[existingIndex] = { ...intake, updatedAt: new Date().toISOString() };
            console.log('Updated existing intake, new intakes array:', updated);
            return { intakes: updated };
          }
          const newIntakes = [...state.intakes, intake];
          console.log('Added new intake, new intakes array:', newIntakes);
          return { intakes: newIntakes };
        }),

      getIntakeByCompanyId: (companyId) => {
        return get().intakes.find((i) => i.companyId === companyId);
      },

      updateCompanyFromIntake: (companyId, intake) =>
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  name: intake.officialName || c.name,
                  contactEmail: intake.emails?.[0] || c.contactEmail,
                  phone: intake.mainPhone || c.phone,
                  address: intake.physicalAddress || c.address,
                  logoUrl: intake.logoUrl || c.logoUrl,
                  status: 'ACTIVE',
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        })),

      addVerificationLog: (companyId, entry) =>
        set((state) => ({
          intakes: state.intakes.map((intake) =>
            intake.companyId === companyId
              ? {
                  ...intake,
                  verificationLog: [...(intake.verificationLog || []), entry],
                  updatedAt: new Date().toISOString(),
                }
              : intake
          ),
        })),

      updateLastVerified: (companyId, timestamp) =>
        set((state) => ({
          intakes: state.intakes.map((intake) =>
            intake.companyId === companyId
              ? {
                  ...intake,
                  lastVerified: timestamp,
                  updatedAt: new Date().toISOString(),
                }
              : intake
          ),
        })),
    }),
    {
      name: 'eyesai-crm-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
      partialize: (state) => ({
        companies: state.companies,
        tasks: state.tasks,
        intakes: state.intakes,
      }),
    }
  )
);

// Force rehydration on client side
if (typeof window !== 'undefined') {
  useStore.persist.rehydrate();
  console.log('Zustand store rehydrated on client');
}