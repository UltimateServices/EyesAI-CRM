'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Search,
  LayoutGrid,
  List,
  MapPin,
  Globe,
  Phone,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function DashboardPage() {
  const router = useRouter();
  const companies = useStore((state) => state.companies);
  const fetchCompanies = useStore((state) => state.fetchCompanies);
  const initializeOrganization = useStore((state) => state.initializeOrganization);
  const currentOrganization = useStore((state) => state.currentOrganization);
  const currentUserRole = useStore((state) => state.currentUserRole);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await initializeOrganization();
      await fetchCompanies();
      setLoading(false);
    };
    init();
  }, [initializeOrganization, fetchCompanies]);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.website?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status || 'active'] || 'bg-slate-100 text-slate-700';
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
    <div className="p-6 max-w-[1800px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            {currentOrganization?.name} • {currentUserRole?.toUpperCase()}
          </p>
        </div>
        <Button onClick={() => router.push('/companies/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Companies</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{companies.length}</p>
            </div>
            <Building2 className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {companies.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {companies.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Inactive</p>
              <p className="text-3xl font-bold text-slate-600 mt-2">
                {companies.filter(c => c.status === 'inactive').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and View Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Companies Grid/List */}
      {filteredCompanies.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchQuery ? 'No companies found' : 'No companies yet'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first company'}
          </p>
          {!searchQuery && (
            <Button onClick={() => router.push('/companies/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Company
            </Button>
          )}
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card
              key={company.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/companies/${company.id}`)}
            >
              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                    <img 
                      src={company.logoUrl} 
                      alt={`${company.name} logo`}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {company.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{company.name}</h3>
                  <Badge className={`${getStatusColor(company.status)} mt-1`}>
                    {company.status || 'active'}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {company.website && (
                  <div className="flex items-center gap-2 truncate">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{company.website}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    {company.phone}
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{company.address}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-slate-200">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/companies/${company.id}`)}
              >
                <div className="flex items-center gap-4">
                  {company.logoUrl ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                      <img 
                        src={company.logoUrl} 
                        alt={`${company.name} logo`}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {company.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{company.name}</h3>
                      <Badge className={getStatusColor(company.status)}>
                        {company.status || 'active'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                      {company.website && (
                        <span className="flex items-center gap-1 truncate">
                          <Globe className="w-3 h-3" />
                          {company.website}
                        </span>
                      )}
                      {company.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {company.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}