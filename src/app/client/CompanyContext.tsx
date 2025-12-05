'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CompanyContextType {
  company: any;
  user: any;
  loading: boolean;
  refetchCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  user: null,
  loading: true,
  refetchCompany: async () => {},
});

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClientComponentClient());

  const fetchCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const res = await fetch('/api/client/company');
        const data = await res.json();

        if (data.success && data.data) {
          setCompany(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const refetchCompany = async () => {
    setLoading(true);
    await fetchCompanyData();
  };

  return (
    <CompanyContext.Provider value={{ company, user, loading, refetchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}
