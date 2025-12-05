'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Loader2, CreditCard, CheckCircle2, Save, Building2 } from 'lucide-react';

interface StripeInfoModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface CompanyData {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  plan: string;
  package_type: string;
  contact_name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export function StripeInfoModal({
  companyId,
  companyName,
  onClose,
  onSuccess
}: StripeInfoModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isStripeComplete, setIsStripeComplete] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${companyId}`);
      const { data } = await response.json();

      setCompanyData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipcode: data.zipcode || '',
        plan: data.plan || 'DISCOVER',
        package_type: data.package_type || 'DISCOVER',
        contact_name: data.contact_name || '',
        stripe_customer_id: data.stripe_customer_id || null,
        stripe_subscription_id: data.stripe_subscription_id || null,
      });

      // Check if came from Stripe
      setIsStripeComplete(!!data.stripe_customer_id);
    } catch (error) {
      console.error('Error fetching company data:', error);
      alert('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    if (companyData) {
      setCompanyData({ ...companyData, [field]: value });
    }
  };

  const handleSave = async () => {
    if (!companyData) return;

    setSaving(true);
    try {
      // Only send fields that exist in the companies table
      const updateData = {
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone,
        website: companyData.website,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        zipcode: companyData.zipcode,
        plan: companyData.plan,
        package_type: companyData.package_type,
        contact_name: companyData.contact_name,
      };

      console.log('Saving company data:', updateData);
      console.log('API URL:', `/api/companies/${companyId}`);

      let response;
      try {
        response = await fetch(`/api/companies/${companyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        console.log('Response received, status:', response.status);
      } catch (fetchError) {
        console.error('Fetch failed:', fetchError);
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
      }

      let responseData;
      try {
        responseData = await response.json();
        console.log('Response data:', responseData);
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        console.error('Update failed with status:', response.status);
        throw new Error(responseData.error || responseData.details || `Failed to save company data (${response.status})`);
      }

      console.log('Save successful!');
      alert('✅ Company information saved successfully');

      // Refresh the company data to show saved changes
      await fetchCompanyData();

      onSuccess();
    } catch (error: any) {
      console.error('Save error (full):', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteStep = async () => {
    if (!companyData) return;

    // Validate required fields for manual completion
    const requiredFields = ['name', 'email'];
    const missingFields = requiredFields.filter(field => !companyData[field as keyof CompanyData]);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    const confirmed = confirm('Mark Step 1 complete? This will allow progression to Step 2.');
    if (!confirmed) return;

    setCompleting(true);
    try {
      // First save the data
      const updateData = {
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone,
        website: companyData.website,
        address: companyData.address,
        city: companyData.city,
        state: companyData.state,
        zipcode: companyData.zipcode,
        plan: companyData.plan,
        package_type: companyData.package_type,
        contact_name: companyData.contact_name,
      };

      await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      // Then mark step 1 complete
      const response = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, stepNumber: 1 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete step');
      }

      alert('✅ Step 1 marked complete!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Complete step error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Step 1: Stripe Checkout Data
                </h2>
                <p className="text-sm text-slate-600">{companyName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={saving || completing}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-slate-600">Loading company data...</span>
            </div>
          ) : (
            <>
              {/* Stripe Status Banner */}
              {isStripeComplete ? (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Completed via Stripe Checkout
                    </p>
                    <p className="text-xs text-green-700">
                      Customer ID: {companyData?.stripe_customer_id}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Manual Entry Required
                    </p>
                    <p className="text-xs text-amber-700">
                      Fill in company details and click "Complete Step 1" when done
                    </p>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              {companyData && (
                <div className="space-y-6">
                  {/* Company Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      Company Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                          value={companyData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="e.g., Acme Corporation"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          Contact Name
                        </label>
                        <Input
                          value={companyData.contact_name}
                          onChange={(e) => handleInputChange('contact_name', e.target.value)}
                          placeholder="e.g., John Smith"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="email"
                          value={companyData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="contact@company.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          Phone
                        </label>
                        <Input
                          type="tel"
                          value={companyData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          Website
                        </label>
                        <Input
                          type="url"
                          value={companyData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://company.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          Street Address
                        </label>
                        <Input
                          value={companyData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          City
                        </label>
                        <Input
                          value={companyData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          State
                        </label>
                        <Input
                          value={companyData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="NY"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          ZIP Code
                        </label>
                        <Input
                          value={companyData.zipcode}
                          onChange={(e) => handleInputChange('zipcode', e.target.value)}
                          placeholder="10001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plan Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      Plan Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">
                          Package
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          value={companyData.plan}
                          onChange={(e) => handleInputChange('plan', e.target.value)}
                        >
                          <option value="DISCOVER">DISCOVER - $39/mo</option>
                          <option value="VERIFIED">VERIFIED - $69/mo</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Information (Read-only if from Stripe) */}
                  {isStripeComplete && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-3">
                        Stripe Information
                      </h3>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                        <div>
                          <p className="text-xs font-medium text-slate-600">Customer ID</p>
                          <p className="text-sm font-mono text-slate-900">
                            {companyData.stripe_customer_id || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-600">Subscription ID</p>
                          <p className="text-sm font-mono text-slate-900">
                            {companyData.stripe_subscription_id || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-between pt-6 border-t mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={saving || completing}
                >
                  Cancel
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={saving || completing}
                    className="gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  {!isStripeComplete && (
                    <Button
                      onClick={handleCompleteStep}
                      disabled={saving || completing}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {completing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Complete Step 1
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
