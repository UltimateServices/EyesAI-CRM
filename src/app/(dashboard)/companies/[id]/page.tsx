'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanyOverview } from '@/components/company/company-overview';
import { IntakeForm } from '@/components/company/intake-form';
import MediaGallery from '@/components/company/media-gallery';
import Reviews from '@/components/company/reviews';
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-purple-100 text-purple-700',
      ACTIVE: 'bg-green-100 text-green-700',
      CHURNED: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${company.name}?`)) {
      deleteCompany(company.id);
      router.push('/dashboard');
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
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <span>{(intake?.officialName || company.name).charAt(0)}</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {intake?.officialName || company.name}
              </h1>

              <div className="flex items-center gap-2 mb-3">
                <Badge className={getStatusColor(company.status)}>
                  {company.status}
                </Badge>
                <Badge variant="outline">{company.plan}</Badge>
                {company.assignedVaName && (
                  <Badge variant="secondary">{company.assignedVaName}</Badge>
                )}
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                {(intake?.website || company.website) && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={intake?.website || company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600"
                    >
                      {intake?.website || company.website}
                    </a>
                  </div>
                )}
                {(intake?.mainPhone || company.phone) && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {intake?.mainPhone || company.phone}
                  </div>
                )}
                {(intake?.physicalAddress || company.address) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {intake?.physicalAddress || company.address}
                  </div>
                )}
              </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
      </Tabs>
    </div>
  );
}