'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function MigrateDataPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runMigration = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/migrate-intake-to-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Migrate Intake Data to Company Columns</h1>
        <p className="text-slate-600">
          This tool extracts data from your intake's romaData JSON and populates the individual
          company columns needed for Webflow sync.
        </p>
      </div>

      <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold mb-2">What this does:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Extracts AI Summary from intake.romaData.ai_overview</li>
              <li>Extracts About text from intake.romaData.about_and_badges</li>
              <li>Extracts Tagline from intake.romaData.hero</li>
              <li>Extracts Tags/Badges from intake.romaData.about_and_badges.company_badges</li>
              <li>Extracts Contact Info (phone, email, address, city, state, zip)</li>
              <li>Extracts Social Media URLs if available</li>
              <li>Extracts Pricing Information</li>
            </ul>
            <p className="mt-3 font-semibold">
              After running this, you can sync to Webflow and all the content will appear!
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-4 mb-6">
        <Button
          onClick={runMigration}
          disabled={loading}
          size="lg"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Migrating Data...' : 'Run Migration'}
        </Button>
      </div>

      {result && (
        <Card className="p-6">
          {result.success ? (
            <div>
              <div className="flex items-center gap-2 text-green-600 font-semibold text-lg mb-4">
                <CheckCircle2 className="w-5 h-5" />
                Migration Complete!
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600">{result.migrated || 0}</div>
                  <div className="text-sm text-slate-600">Successful</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-yellow-600">{result.skipped || 0}</div>
                  <div className="text-sm text-slate-600">Skipped</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-3xl font-bold text-red-600">{result.failed || 0}</div>
                  <div className="text-sm text-slate-600">Failed</div>
                </div>
              </div>

              {result.message && (
                <p className="text-slate-700 mb-4">{result.message}</p>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold text-red-600 mb-2">Errors:</h3>
                  <div className="space-y-2">
                    {result.errors.map((err: any, idx: number) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                        <div className="font-medium">{err.companyName}</div>
                        <div className="text-slate-600">{err.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>Next Step:</strong> Go to your Companies page and click "Sync to Webflow" to
                  publish the migrated data to your live profiles!
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-red-600 font-semibold text-lg mb-4">
                <AlertCircle className="w-5 h-5" />
                Migration Failed
              </div>
              <p className="text-slate-700">{result.error || 'Unknown error occurred'}</p>
              {result.details && (
                <p className="text-sm text-slate-500 mt-2">{result.details}</p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
