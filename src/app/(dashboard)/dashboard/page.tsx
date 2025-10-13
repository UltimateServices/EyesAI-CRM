'use client';

import { useStore } from '@/lib/store';
import { StatsCard } from '@/components/dashboard/stats-card';
import { DataManager } from '@/components/data-manager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const companies = useStore((state) => state.companies);
  const tasks = useStore((state) => state.tasks);

  const stats = {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((c) => c.status === 'ACTIVE').length,
    newCompanies: companies.filter((c) => c.status === 'NEW').length,
    pendingTasks: tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-purple-100 text-purple-700',
      ACTIVE: 'bg-green-100 text-green-700',
      CHURNED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your companies and track progress</p>
        </div>
        <Button onClick={() => router.push('/companies/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          New Company
        </Button>
      </div>

      <DataManager />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Companies"
          value={stats.totalCompanies}
          icon="building"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Companies"
          value={stats.activeCompanies}
          icon="check"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="New Companies"
          value={stats.newCompanies}
          icon="plus"
          trend={{ value: 3, isPositive: true }}
        />
        <StatsCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon="clock"
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Companies</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/companies">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No companies yet</h3>
            <p className="text-slate-500 mb-4">Get started by adding your first company</p>
            <Button onClick={() => router.push('/companies/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.slice(0, 5).map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{company.name}</h3>
                    <p className="text-sm text-slate-500">{company.website}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={getStatusColor(company.status)}>
                    {company.status}
                  </Badge>
                  <Badge variant="secondary">{company.plan}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}