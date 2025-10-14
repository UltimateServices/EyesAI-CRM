'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewCompanyPage() {
  const router = useRouter();
  const addCompany = useStore((state) => state.addCompany);

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    contactEmail: '',
    phone: '',
    address: '',
    logoUrl: '',
    plan: 'DISCOVER' as 'DISCOVER' | 'VERIFIED',
    status: 'NEW' as 'NEW' | 'ACTIVE' | 'CHURNED',
    assignedVaName: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('❌ Company name is required!');
      return;
    }

    if (!formData.website.trim()) {
      alert('❌ Website is required!');
      return;
    }

    // Create new company
    const newCompany = {
      id: `c${Date.now()}`,
      name: formData.name.trim(),
      website: formData.website.trim(),
      logoUrl: formData.logoUrl.trim() || undefined,
      contactEmail: formData.contactEmail.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      address: formData.address.trim() || undefined,
      status: formData.status,
      plan: formData.plan,
      assignedVaName: formData.assignedVaName.trim() || undefined,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    addCompany(newCompany);
    alert('✅ Company created successfully!');
    router.push(`/companies/${newCompany.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add New Company</h1>
          <p className="text-slate-500 mt-1">Enter company details to get started</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Major Dumpsters Inc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Website *
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123 Main St, New York, NY 10001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Logo URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => updateField('logoUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                  {formData.logoUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-2">Logo Preview:</p>
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo preview" 
                        className="w-24 h-24 object-contain border border-slate-200 rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Plan
                  </label>
                  <select
                    value={formData.plan}
                    onChange={(e) => updateField('plan', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="DISCOVER">Discover</option>
                    <option value="VERIFIED">Verified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NEW">New</option>
                    <option value="ACTIVE">Active</option>
                    <option value="CHURNED">Churned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assigned VA
                  </label>
                  <input
                    type="text"
                    value={formData.assignedVaName}
                    onChange={(e) => updateField('assignedVaName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John VA"
                  />
                </div>
              </div>
            </div>

            {/* Current Preview */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Preview</h3>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-16 h-16 rounded-lg bg-slate-200 flex items-center justify-center overflow-hidden">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">
                    {formData.name || 'Company Name'}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {formData.website || 'https://website.com'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{formData.plan}</Badge>
                    <Badge variant="secondary">{formData.status}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          <Button type="submit" className="gap-2">
            <Save className="w-4 h-4" />
            Create Company
          </Button>
        </div>
      </form>
    </div>
  );
}