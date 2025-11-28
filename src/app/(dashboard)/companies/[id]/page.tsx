'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CompanyOverview } from '@/components/company/company-overview';
import { IntakeForm } from '@/components/company/intake-form';
import MediaGallery from '@/components/company/media-gallery';
import { Reviews } from '@/components/company/reviews';
import { MonthlyDeliverables } from '@/components/company/monthly-deliverables';
import BlogBuilder from '@/components/company/blog-builder';
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
  Loader2,
  Upload,
  ExternalLink,
  Database
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
  const [syncing, setSyncing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    website: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

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

  const handleDebug = async () => {
    setDebugging(true);
    try {
      const response = await fetch(`/api/debug-roma-data?companyId=${company.id}`);
      const data = await response.json();

      console.log('ROMA DATA STRUCTURE:', data);
      alert('Check console for roma_data structure');
    } catch (error: any) {
      console.error('Debug error:', error);
      alert(`Debug failed: ${error.message}`);
    } finally {
      setDebugging(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm(`Migrate ${company.name} data to new Webflow-aligned structure?\n\nThis will copy all company data, images, and reviews to the database.`)) {
      return;
    }

    setMigrating(true);

    try {
      const response = await fetch('/api/migrate-company-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId: company.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      console.log('Migration success:', data);

      const summary = [
        `Migrated ${data.migrated_fields.length} fields`,
        data.media_saved > 0 ? `${data.media_saved} images saved` : null,
        data.reviews_saved > 0 ? `${data.reviews_saved} reviews saved` : null,
      ].filter(Boolean).join('\n');

      alert(`✅ Migration complete!\n\n${summary}`);

      // Refresh data
      await Promise.all([
        fetchIntakes(),
        fetchCompanies(),
      ]);

      // Optionally reload page to refresh media & reviews
      window.location.reload();
    } catch (error: any) {
      alert(`❌ Migration failed: ${error.message}`);
      console.error('Migration error:', error);
    } finally {
      setMigrating(false);
    }
  };

  const handleSync = async () => {
    if (!confirm(`Sync ${company.name} to Webflow?\n\nThis will publish or update the profile on your Webflow site.`)) {
      return;
    }

    setSyncing(true);

    try {
      const response = await fetch('/api/webflow/publish-company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyId: company.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Sync error response:', data);
        const errorMsg = data.error || 'Failed to sync';
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        throw new Error(errorMsg + errorDetails);
      }

      console.log('Sync success:', data);
      alert(`✅ ${data.message}\n\nLive at: ${data.liveUrl}`);

      // Refresh company data to show updated sync status
      await fetchCompanies();
    } catch (error: any) {
      alert(`❌ Failed to sync: ${error.message}`);
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = () => {
    // Pre-fill form with current company data
    setEditForm({
      name: company.name || '',
      website: company.website || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zip: company.zip || '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update company');
      }

      alert('✅ Company updated successfully!');
      setEditModalOpen(false);

      // Refresh company data
      await fetchCompanies();
    } catch (error: any) {
      alert(`❌ Failed to update: ${error.message}`);
      console.error('Update error:', error);
    } finally {
      setSaving(false);
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
                {company.webflowPublished && (
                  <Badge className="bg-green-100 text-green-700">
                    Published
                  </Badge>
                )}
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
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" />
                  Updated {new Date(company.updatedAt).toLocaleDateString()}
                </div>
              )}
              {company.lastSyncedAt && (
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Synced {new Date(company.lastSyncedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDebug}
                disabled={debugging}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                title="Debug roma_data structure"
              >
                {debugging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Debugging...
                  </>
                ) : (
                  'Debug Data'
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleMigrate}
                disabled={migrating}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                title="Migrate company data to Webflow-aligned structure"
              >
                {migrating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Migrate Data
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sync
                  </>
                )}
              </Button>

              {company.webflowPublished && company.webflowSlug && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <a
                    href={`${process.env.NEXT_PUBLIC_WEBFLOW_DOMAIN || 'http://eyesai.webflow.io'}/profile/${company.webflowSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Live
                  </a>
                </Button>
              )}

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
          <CompanyOverview company={company} />
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

      {/* Edit Company Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Company Details</DialogTitle>
            <DialogDescription>
              Update company information. Changes will be saved to your database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name *
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Website
                </label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone
                </label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  City
                </label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="San Francisco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  State
                </label>
                <Input
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ZIP Code
                </label>
                <Input
                  value={editForm.zip}
                  onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })}
                  placeholder="94103"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving || !editForm.name}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}