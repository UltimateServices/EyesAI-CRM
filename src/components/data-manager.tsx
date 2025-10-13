'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Upload, Database } from 'lucide-react';

export function DataManager() {
  const [importing, setImporting] = useState(false);

  const exportData = () => {
    try {
      // Get all data from localStorage
      const companiesData = localStorage.getItem('companies-storage');
      const intakesData = localStorage.getItem('intakes-storage');
      const tasksData = localStorage.getItem('tasks-storage');

      const data = {
        companies: companiesData ? JSON.parse(companiesData) : null,
        intakes: intakesData ? JSON.parse(intakesData) : null,
        tasks: tasksData ? JSON.parse(tasksData) : null,
        exportedAt: new Date().toISOString(),
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `va-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Failed to export data');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // Restore data to localStorage
        if (data.companies) {
          localStorage.setItem('companies-storage', JSON.stringify(data.companies));
        }
        if (data.intakes) {
          localStorage.setItem('intakes-storage', JSON.stringify(data.intakes));
        }
        if (data.tasks) {
          localStorage.setItem('tasks-storage', JSON.stringify(data.tasks));
        }

        alert('✅ Data imported successfully! Refreshing...');
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('❌ Failed to import data. Make sure the file is valid.');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">Data Management</h3>
          <p className="text-sm text-slate-600">Export your data or import from another device</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={importing}
            asChild
          >
            <label htmlFor="import-file" className="cursor-pointer">
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import'}
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </Button>
        </div>
      </div>
    </Card>
  );
}