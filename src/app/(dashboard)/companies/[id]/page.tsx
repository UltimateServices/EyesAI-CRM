'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyOverview } from '@/components/company/company-overview';
import { IntakeForm } from '@/components/company/intake-form';
import { MediaGallery } from '@/components/company/media-gallery';
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  Star,
  Trash2,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const company = useStore((state) => 
    state.companies.find((c) => c.id === companyId)
  );
  const getIntakeByCompanyId = useStore((state) => state.getIntakeByCompanyId);
  const deleteCompany = useStore((state) => state.deleteCompany);

  const [activeTab, setActiveTab] = useState('overview');

  const intake = getIntakeByCompanyId(companyId);

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-purple-100 text-purple-700',
      ACTIVE: 'bg-green-100 text-green-700',
      CHURNED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${company.name}? This action cannot be undone.`)) {
      deleteCompany(companyId);
      router.push('/dashboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Company Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
                <Badge variant="secondary" className={getStatusColor(company.status)}>
                  {company.status}
                </Badge>
                <Badge variant="secondary">{company.plan}</Badge>
              </div>

              {company.website && (
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 mb-3"
                >
                  <Globe className="w-4 h-4" />
                  {company.website}
                </a>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                {company.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {company.contactEmail}
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

              {/* Only show reviews if we have real data from intake */}
              {intake && intake.status === 'complete' && (intake.verifiedFiveStarTotal || intake.googleReviewsTotal) && (
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium text-slate-900">
                    {intake.verifiedFiveStarTotal || intake.googleReviewsTotal}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-slate-500">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                Created {new Date(company.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Updated {new Date(company.lastUpdated).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
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
      </Tabs>
    </div>
  );
}