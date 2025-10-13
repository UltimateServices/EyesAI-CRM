'use client';

import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isThisWeek } from 'date-fns';

export default function DashboardPage() {
  const companies = useStore((state) => state.companies);
  const tasks = useStore((state) => state.tasks);

  // Filter companies by status
  const newCompanies = companies.filter((c) => c.status === 'NEW');
  const discoverCompanies = companies.filter(
    (c) => c.status === 'ACTIVE' && c.plan === 'DISCOVER'
  );
  const verifiedCompanies = companies.filter(
    (c) => c.status === 'ACTIVE' && c.plan === 'VERIFIED'
  );

  // Calculate stats
  const newThisWeek = companies.filter((c) => isThisWeek(new Date(c.createdAt))).length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt) < new Date()
  ).length;
  const dueToday = tasks.filter(
    (t) => t.status !== 'done' && t.dueAt && isToday(new Date(t.dueAt))
  ).length;
  const activeProfiles = companies.filter((c) => c.status === 'ACTIVE').length;

  const stats = [
    {
      label: 'New This Week',
      value: newThisWeek,
      icon: Building2,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Tasks Overdue',
      value: overdueTasks,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
    },
    {
      label: 'Due Today',
      value: dueToday,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Active Profiles',
      value: activeProfiles,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
    },
  ];

  const renderCompanyCard = (company: any) => (
    <Link
      href={`/companies/${company.id}`}
      key={company.id}
      className="block"
    >
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Building2 className="w-6 h-6 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 truncate">
                {company.name}
              </h3>
              {company.status === 'NEW' && (
                <Badge className="bg-purple-100 text-purple-700 flex-shrink-0">
                  NEW
                </Badge>
              )}
            </div>

            <Badge
              variant="secondary"
              className={`mt-2 ${
                company.plan === 'VERIFIED'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {company.plan}
            </Badge>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              {company.assignedVaName && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{company.assignedVaName}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(company.createdAt), 'MMM d')}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of all company accounts and tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Pipeline</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/companies">
              View All Companies
              <TrendingUp className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Column */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">New</h3>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {newCompanies.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {newCompanies.length > 0 ? (
                newCompanies.map(renderCompanyCard)
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-slate-500 text-sm">No new companies</p>
                </Card>
              )}
            </div>
          </div>

          {/* Discover Column */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">Discover</h3>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {discoverCompanies.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {discoverCompanies.length > 0 ? (
                discoverCompanies.map(renderCompanyCard)
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-slate-500 text-sm">No Discover companies</p>
                </Card>
              )}
            </div>
          </div>

          {/* Verified Column */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">Verified</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {verifiedCompanies.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {verifiedCompanies.length > 0 ? (
                verifiedCompanies.map(renderCompanyCard)
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-slate-500 text-sm">No Verified companies</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}