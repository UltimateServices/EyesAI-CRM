'use client';

import { useStore } from '@/lib/store';
import { StatsCard } from '@/components/dashboard/stats-card';
import { DataManager } from '@/components/data-manager';
import { CompanyList } from '@/components/dashboard/company-list';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CompanyList />
        </div>

        <div className="space-y-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}