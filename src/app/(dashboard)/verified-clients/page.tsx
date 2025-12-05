'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BadgeCheck,
  Loader2,
  Building2,
  Calendar,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

interface MonthData {
  id: string;
  month_number: number;
  cycle_start_date: string;
  cycle_end_date: string;
  status: string;
}

interface ClientProgress {
  [companyId: string]: {
    totalDeliverables: number;
    completedDeliverables: number;
    currentMonth: number;
    cycleDay: number;
    cycleStartDate: string;
    cycleEndDate: string;
    allMonths: MonthData[];
    selectedMonthIndex: number;
  };
}

export default function VerifiedClientsPage() {
  const companies = useStore((state) => state.companies);
  const fetchCompanies = useStore((state) => state.fetchCompanies);
  const currentOrganization = useStore((state) => state.currentOrganization);
  const initializeOrganization = useStore((state) => state.initializeOrganization);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<ClientProgress>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!currentOrganization) {
          await initializeOrganization();
        }
        await fetchCompanies();
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
      setLoading(false);
    };
    loadData();
  }, [fetchCompanies, initializeOrganization, currentOrganization]);

  // Filter for Verified package clients who have completed onboarding
  const verifiedClients = companies.filter((company) =>
    (company.plan?.toLowerCase() === 'verified' || company.plan?.toLowerCase() === 'premium') &&
    company.status === 'ONBOARDED'
  );

  // Fetch progress for each client
  useEffect(() => {
    const fetchProgress = async () => {
      const progressData: ClientProgress = {};

      for (const client of verifiedClients) {
        try {
          const monthsRes = await fetch(`/api/deliverables/${client.id}/months`);
          if (monthsRes.ok) {
            const { months } = await monthsRes.json();
            if (months && months.length > 0) {
              const currentMonthIndex = months.length - 1; // Start with most recent month
              const currentMonth = months[currentMonthIndex];
              const delRes = await fetch(`/api/deliverables/${client.id}/month/${currentMonth.id}`);
              if (delRes.ok) {
                const { deliverables } = await delRes.json();
                const completed = deliverables.filter((d: any) => d.status === 'published').length;
                const cycleStart = new Date(currentMonth.cycle_start_date);
                const today = new Date();
                const daysElapsed = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));

                progressData[client.id] = {
                  totalDeliverables: deliverables.length,
                  completedDeliverables: completed,
                  currentMonth: currentMonth.month_number,
                  cycleDay: Math.max(0, Math.min(daysElapsed, 28)),
                  cycleStartDate: currentMonth.cycle_start_date,
                  cycleEndDate: currentMonth.cycle_end_date,
                  allMonths: months,
                  selectedMonthIndex: currentMonthIndex
                };
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching progress for ${client.id}:`, error);
        }
      }

      setProgress(progressData);
    };

    if (verifiedClients.length > 0) {
      fetchProgress();
    }
  }, [verifiedClients.length]);

  // Handle month navigation
  const navigateMonth = async (companyId: string, direction: 'prev' | 'next') => {
    const clientProgress = progress[companyId];
    if (!clientProgress || !clientProgress.allMonths) return;

    const newIndex = direction === 'prev'
      ? clientProgress.selectedMonthIndex - 1
      : clientProgress.selectedMonthIndex + 1;

    // Check bounds
    if (newIndex < 0 || newIndex >= clientProgress.allMonths.length) return;

    const selectedMonth = clientProgress.allMonths[newIndex];

    try {
      const delRes = await fetch(`/api/deliverables/${companyId}/month/${selectedMonth.id}`);
      if (delRes.ok) {
        const { deliverables } = await delRes.json();
        const completed = deliverables.filter((d: any) => d.status === 'published').length;
        const cycleStart = new Date(selectedMonth.cycle_start_date);
        const today = new Date();
        const daysElapsed = Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));

        setProgress(prev => ({
          ...prev,
          [companyId]: {
            ...prev[companyId],
            totalDeliverables: deliverables.length,
            completedDeliverables: completed,
            currentMonth: selectedMonth.month_number,
            cycleDay: Math.max(0, Math.min(daysElapsed, 28)),
            cycleStartDate: selectedMonth.cycle_start_date,
            cycleEndDate: selectedMonth.cycle_end_date,
            selectedMonthIndex: newIndex
          }
        }));
      }
    } catch (error) {
      console.error(`Error navigating month for ${companyId}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <img
              src="/verified-icon.png"
              alt="Verified icon"
              className="w-16 h-12"
            />
            Verified Clients
          </h1>
          <p className="text-slate-600 mt-1">
            Manage monthly deliverables for Verified package clients ($69/month)
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {verifiedClients.length} {verifiedClients.length === 1 ? 'Client' : 'Clients'}
        </Badge>
      </div>

      {/* Client List */}
      {verifiedClients.length === 0 ? (
        <Card className="p-12 text-center">
          <BadgeCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Verified Clients Yet
          </h3>
          <p className="text-slate-600 mb-4">
            Clients will appear here once they complete onboarding with a Verified package.
          </p>
          <Link href="/new-clients">
            <Button>
              View New Clients
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {verifiedClients.map((company) => {
            const clientProgress = progress[company.id];
            const completionPercentage = clientProgress
              ? Math.round((clientProgress.completedDeliverables / clientProgress.totalDeliverables) * 100)
              : 0;
            const cyclePercentage = clientProgress
              ? Math.min(Math.round((clientProgress.cycleDay / 28) * 100), 100)
              : 0;

            return (
              <Link key={company.id} href={`/companies/${company.id}?tab=deliverables`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                  {/* Company Header */}
                  <div className="p-6 bg-gradient-to-br from-white to-slate-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center border border-slate-200">
                            <span className="text-lg font-bold text-green-600">
                              {company.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-green-600 transition-colors">
                            {company.name}
                          </h3>
                          {company.webflowSlug && (
                            <p className="text-sm text-blue-600 mt-1">
                              eyesai.ai/profile/{company.webflowSlug}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-white text-green-600 border border-green-600 flex items-center gap-2">
                        <img
                          src="/verified-icon.png"
                          alt="Verified"
                          className="w-5 h-4"
                        />
                        Verified
                      </Badge>
                    </div>

                    {/* Progress Section */}
                    {clientProgress ? (
                      <div className="grid grid-cols-3 gap-6 p-4 bg-white rounded-lg border border-slate-200">
                        {/* Month Navigation */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigateMonth(company.id, 'prev');
                            }}
                            disabled={clientProgress.selectedMonthIndex === 0}
                            className="h-8 w-8 p-0 flex items-center justify-center rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="text-center flex-1">
                            <div className="text-sm font-semibold text-slate-900">
                              Month {clientProgress.currentMonth}
                            </div>
                            <div className="text-xs text-slate-600">
                              {new Date(clientProgress.cycleStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(clientProgress.cycleEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigateMonth(company.id, 'next');
                            }}
                            disabled={clientProgress.allMonths && clientProgress.selectedMonthIndex === clientProgress.allMonths.length - 1}
                            className="h-8 w-8 p-0 flex items-center justify-center rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Deliverables Progress */}
                        <div className="flex flex-col justify-center">
                          <div className="text-sm font-semibold text-slate-900 mb-1.5">
                            {clientProgress.completedDeliverables} of {clientProgress.totalDeliverables} Complete
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div
                              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Cycle Progress */}
                        <div className="flex flex-col justify-center">
                          <div className="text-sm font-semibold text-slate-900 mb-1.5">
                            Day {clientProgress.cycleDay} of 28
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div
                              className="bg-slate-600 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${cyclePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-100 rounded-lg text-center text-sm text-slate-600">
                        Loading progress...
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
