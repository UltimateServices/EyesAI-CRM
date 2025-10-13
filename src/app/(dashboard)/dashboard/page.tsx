'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Company } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const PIPELINE_SECTIONS = [
  { 
    id: 'new',
    label: 'New', 
    color: 'bg-purple-100 text-purple-700',
    filter: (c: Company) => c.status === 'NEW'
  },
  { 
    id: 'discover',
    label: 'Discover', 
    color: 'bg-blue-100 text-blue-700',
    filter: (c: Company) => c.status === 'ACTIVE' && c.plan === 'DISCOVER'
  },
  { 
    id: 'verified',
    label: 'Verified', 
    color: 'bg-green-100 text-green-700',
    filter: (c: Company) => c.status === 'ACTIVE' && c.plan === 'VERIFIED'
  },
];

function CompanyCard({ company }: { company: Company }) {
  const isNew = company.status === 'NEW';
  
  return (
    <Link href={`/companies/${company.id}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-slate-900 truncate">
              {company.name}
            </h4>

            <div className="flex items-center gap-1 mt-1">
              {isNew && (
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                  NEW
                </Badge>
              )}
              <Badge 
                variant={company.plan === 'VERIFIED' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {company.plan}
              </Badge>
            </div>

            {company.assignedVaName && (
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                <Users className="w-3 h-3" />
                <span>{company.assignedVaName}</span>
              </div>
            )}

            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(company.createdAt), 'MMM d')}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const companies = useStore((state) => state.companies);
  const tasks = useStore((state) => state.tasks);

  const kpis = useMemo(() => {
    const newThisWeek = companies.filter((c) => {
      const created = new Date(c.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created >= weekAgo;
    }).length;

    const overdueTasks = tasks.filter((t) => {
      if (!t.dueAt || t.status === 'done') return false;
      return new Date(t.dueAt) < new Date();
    }).length;

    const dueToday = tasks.filter((t) => {
      if (!t.dueAt || t.status === 'done') return false;
      const today = new Date().toDateString();
      return new Date(t.dueAt).toDateString() === today;
    }).length;

    const activeProfiles = companies.filter((c) => c.status === 'ACTIVE').length;

    return { newThisWeek, overdueTasks, dueToday, activeProfiles };
  }, [companies, tasks]);

  const companiesBySection = useMemo(() => {
    return PIPELINE_SECTIONS.reduce((acc, section) => {
      acc[section.id] = companies.filter(section.filter);
      return acc;
    }, {} as Record<string, Company[]>);
  }, [companies]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of all company accounts and tasks</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">New This Week</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.newThisWeek}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Tasks Overdue</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{kpis.overdueTasks}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Due Today</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{kpis.dueToday}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Profiles</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{kpis.activeProfiles}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Pipeline</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/companies">
              View All Companies
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_SECTIONS.map((section) => {
            const sectionCompanies = companiesBySection[section.id] || [];

            return (
              <div key={section.id} className="flex-shrink-0 w-80">
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-700">{section.label}</h3>
                    <Badge variant="secondary" className={section.color}>
                      {sectionCompanies.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 min-h-[200px] bg-slate-50 rounded-lg p-3 border-2 border-slate-200">
                  {sectionCompanies.length > 0 ? (
                    sectionCompanies.map((company) => (
                      <CompanyCard key={company.id} company={company} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      No companies
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}