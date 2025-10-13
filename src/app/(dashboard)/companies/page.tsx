'use client';

import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState } from 'react';

export default function CompaniesPage() {
  const companies = useStore((state) => state.companies);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.website.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || company.status === statusFilter;
    const matchesPlan = planFilter === 'ALL' || company.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-purple-100 text-purple-700',
      ACTIVE: 'bg-green-100 text-green-700',
      CHURNED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      DISCOVER: 'bg-slate-100 text-slate-700',
      VERIFIED: 'bg-blue-100 text-blue-700',
    };
    return colors[plan] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-600 mt-1">
            Manage all {companies.length} company accounts
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="NEW">New</option>
              <option value="ACTIVE">Active</option>
              <option value="CHURNED">Churned</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="ALL">All Plans</option>
              <option value="DISCOVER">Discover</option>
              <option value="VERIFIED">Verified</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total Companies</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{companies.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">New</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {companies.filter((c) => c.status === 'NEW').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {companies.filter((c) => c.status === 'ACTIVE').length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Verified</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {companies.filter((c) => c.plan === 'VERIFIED').length}
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        {filteredCompanies.length > 0 ? (
          filteredCompanies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {company.name}
                        </h3>
                        <p className="text-sm text-blue-600 mt-1">
                          {company.website}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className={getStatusColor(company.status)}>
                          {company.status}
                        </Badge>
                        <Badge variant="secondary" className={getPlanColor(company.plan)}>
                          {company.plan}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      {company.contactEmail && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{company.contactEmail}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {company.address && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{company.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 mt-4 text-xs text-slate-500">
                      {company.assignedVaName && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Assigned to {company.assignedVaName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Added {format(new Date(company.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No companies found</h3>
            <p className="text-slate-600">
              {searchQuery || statusFilter !== 'ALL' || planFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first company'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}