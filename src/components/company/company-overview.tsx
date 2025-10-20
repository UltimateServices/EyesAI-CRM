'use client';

import { Company, Intake } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface CompanyOverviewProps {
  company: Company;
  intake?: Intake | null;
}

export function CompanyOverview({ company, intake }: CompanyOverviewProps) {
  // If no intake or intake not complete, show placeholder
  if (!intake || intake.status !== 'complete') {
    return (
      <Card className="p-12">
        <div className="text-center">
          <FileText className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-3">No Intake Data Available</h3>
          <p className="text-slate-600 text-lg mb-2">
            Complete the intake form to see detailed company information here.
          </p>
          <p className="text-slate-500 text-sm">
            Go to the <strong>Intake</strong> tab to add company details and data.
          </p>
        </div>
      </Card>
    );
  }

  // If intake exists and is complete, show the data from intake
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-500">Company Name</p>
            <p className="text-slate-900 mt-1 text-lg">{company.name}</p>
          </div>
          
          {company.website && (
            <div>
              <p className="text-sm font-medium text-slate-500">Website</p>
              <p className="text-slate-900 mt-1">{company.website}</p>
            </div>
          )}
          
          {company.phone && (
            <div>
              <p className="text-sm font-medium text-slate-500">Phone</p>
              <p className="text-slate-900 mt-1">{company.phone}</p>
            </div>
          )}
          
          {company.contactEmail && (
            <div>
              <p className="text-sm font-medium text-slate-500">Email</p>
              <p className="text-slate-900 mt-1">{company.contactEmail}</p>
            </div>
          )}
          
          {company.address && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-slate-500">Address</p>
              <p className="text-slate-900 mt-1">{company.address}</p>
              {company.city && company.state && (
                <p className="text-slate-700">{company.city}, {company.state} {company.zip}</p>
              )}
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-slate-500">Status</p>
            <p className="text-slate-900 mt-1 capitalize">{company.status}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-slate-500">Plan</p>
            <p className="text-slate-900 mt-1 capitalize">{company.plan}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-green-50 border-green-200">
        <div className="text-center">
          <p className="text-green-800 font-medium">
            ✅ Intake completed and data is ready!
          </p>
          <p className="text-green-700 text-sm mt-2">
            Full intake data will be displayed here once we build out the complete overview sections.
          </p>
        </div>
      </Card>
    </div>
  );
}