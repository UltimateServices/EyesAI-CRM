'use client';

import { Card } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your CRM preferences</p>
      </div>

      <Card className="p-12 text-center">
        <SettingsIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Settings Coming Soon</h3>
        <p className="text-slate-500">
          User preferences, team management, and CRM configuration will be available here.
        </p>
      </Card>
    </div>
  );
}