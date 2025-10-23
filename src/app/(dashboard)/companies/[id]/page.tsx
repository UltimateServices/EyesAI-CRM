'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyOverview } from '@/components/company/company-overview';
import { IntakeForm } from '@/components/company/intake-form';
import MediaGallery from '@/components/company/media-gallery';
import { Reviews } from '@/components/company/reviews';
import { MonthlyDeliverables } from '@/components/company/monthly-deliverables';
import { BlogBuilder } from '@/components/company/blog-builder';
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  Trash2,
  Edit,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const companies = useStore((state) => state.companies);
  const intakes = useStore((state) => state.intakes);
  const fetchCompanies = useStore((state) => state.fetchCompanies);
  const fetchIntakes = useStore((state) => state.fetchIntakes);
  const deleteCompany = useStore((state) => state.deleteCompany);
  const currentUserRole = useStore((state) => state.currentUserRole);
  const initializeOrganization = useStore((state) => state.initializeOrganization);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await initializeOrganization();
      await Promise.all([
        fetchCompanies(),
        fetchIntakes(),
      ]);
      setLoading(false);
    };
    
    loadData();
  }, [initializeOrganization, fetchCompanies, fetchIntakes]);

  const company = companies.find((c) => c.id === companyId);
  const intake = intakes.find((i) => i.companyId === companyId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading company...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Company Not Found</h2>
          <p className="text-slate-600 mb-4">The company you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status || 'active'] || 'bg-slate-100 text-slate-700';
  };

  const handleDelete = async () => {
    if (!['admin', 'manager'].includes(currentUserRole || '')) {
      alert('You do not have permission to delete companies');
      return;
    }

    if (confirm(`Are you sure you want to delete ${company.name}? This action cannot be undone.`)) {
      setDeleting(true);
      try {
        await deleteCompany(company.id);
        router.push('/dashboard');
      } catch (error: any) {
        alert('Failed to delete company: ' + error.message);
        setDeleting(false);
      }
    }
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {company.logoUrl ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                <img 
                  src={company.logoUrl} 
                  alt={`${company.name} logo`}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.className = 'w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0';
                      parent.textContent = company.name.charAt(0).toUpperCase();
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {company.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {company.name}
              </h1>

              <div className="flex items-center gap-2 mb-3">
                <Badge className={getStatusColor(company.status)}>
                  {company.status || 'active'}
                </Badge>
                {company.plan && <Badge variant="outline">{company.plan}</Badge>}
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {company.phone}
                  </div>
                )}
                {company.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {company.address}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-slate-500">
              {company.createdAt && (
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  Created {new Date(company.createdAt).toLocaleDateString()}
                </div>
              )}
              {company.updatedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Updated {new Date(company.updatedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              
              {['admin', 'manager'].includes(currentUserRole || '') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDelete} 
                  disabled={deleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="gap-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger 
            value="deliverables" 
            className="bg-blue-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:bg-blue-100"
          >
            Monthly Deliverables
          </TabsTrigger>
          <TabsTrigger 
            value="blog-builder" 
            className="bg-purple-50 data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-purple-100"
          >
            Blog Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CompanyOverview company={company} intake={intake} />
        </TabsContent>

        <TabsContent value="intake" className="mt-6">
          <IntakeForm company={company} />
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          <MediaGallery company={company} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Reviews company={company} />
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <MonthlyDeliverables company={company} />
        </TabsContent>

        <TabsContent value="blog-builder" className="mt-6">
          <BlogBuilder company={company} />
        </TabsContent>
      </Tabs>
    </div>
  );
}