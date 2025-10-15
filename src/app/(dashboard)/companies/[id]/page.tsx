'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { DataManager } from '@/components/data-manager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Building2, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const companies = useStore((state) => state.companies);
  const tasks = useStore((state) => state.tasks);
  const fetchCompanies = useStore((state) => state.fetchCompanies);
  const fetchIntakes = useStore((state) => state.fetchIntakes);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCompanies(),
        fetchIntakes(),
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchCompanies, fetchIntakes]);

  const stats = {
    totalCompanies: companies?.length || 0,
    activeCompanies: companies?.filter((c) => c.status === 'ACTIVE').length || 0,
    newCompanies: companies?.filter((c) => c.status === 'NEW').length || 0,
    pendingTasks: tasks?.filter((t) => t.status === 'todo' || t.status === 'in_progress').length || 0,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-purple-100 text-purple-700',
      ACTIVE: 'bg-green-100 text-green-700',
      CHURNED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Companies</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalCompanies}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">12%</span>
                <span className="text-sm text-slate-500">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Companies</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.activeCompanies}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">8%</span>
                <span className="text-sm text-slate-500">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">New Companies</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.newCompanies}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">3%</span>
                <span className="text-sm text-slate-500">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Plus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Tasks</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.pendingTasks}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">5%</span>
                <span className="text-sm text-slate-500">vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Companies List */}
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

        {!companies || companies.length === 0 ? (
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