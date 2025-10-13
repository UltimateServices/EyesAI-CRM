'use client';

import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-slate-500 mt-1">Analytics and performance metrics</p>
      </div>

      <Card className="p-12 text-center">
        <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Reports Coming Soon</h3>
        <p className="text-slate-500">
          Monthly reports, performance metrics, and VA productivity tracking will be available here.
        </p>
      </Card>
    </div>
  );
}