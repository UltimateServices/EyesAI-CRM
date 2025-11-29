'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PasteIntakeModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PasteIntakeModal({ companyId, companyName, onClose, onSuccess }: PasteIntakeModalProps) {
  const [pastedJSON, setPastedJSON] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handlePaste = (value: string) => {
    setPastedJSON(value);
    setError('');
    setParsedData(null);
    setShowPreview(false);

    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('Invalid JSON format - must be an object');
        return;
      }
      setParsedData(parsed);
    } catch (err) {
      setError('Invalid JSON format - please check your input');
    }
  };

  const handlePreview = () => {
    if (!parsedData) {
      setError('Please paste valid JSON first');
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (!parsedData) {
      setError('Please paste valid JSON first');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/paste-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          romaData: parsedData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save intake data');
      }

      alert('✅ Intake saved and migrated successfully! Step 2 completed.');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save intake');
      setSubmitting(false);
    }
  };

  const extractPreviewData = () => {
    if (!parsedData) return null;

    const hero = parsedData.hero || {};
    const about = parsedData.about_and_badges || {};
    const contact = parsedData.contact || {};

    return {
      businessName: hero.business_name || hero.company_name || 'N/A',
      tagline: hero.tagline || 'N/A',
      city: contact.city || 'N/A',
      state: contact.state || 'N/A',
      phone: contact.phone || 'N/A',
      email: contact.email || 'N/A',
      website: contact.website || 'N/A',
      about: about.about_text || about.ai_summary_120w || 'N/A',
    };
  };

  const preview = extractPreviewData();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Paste Intake JSON</h2>
              <p className="text-sm text-slate-600 mt-1">
                Company: <span className="font-semibold">{companyName}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Paste Area */}
          {!showPreview ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Paste ROMA JSON here
                </label>
                <textarea
                  value={pastedJSON}
                  onChange={(e) => handlePaste(e.target.value)}
                  placeholder='{"hero": {...}, "about_and_badges": {...}, ...}'
                  className="w-full h-64 p-4 border rounded-lg font-mono text-sm"
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {parsedData && !error && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">JSON validated successfully! Click "Preview & Edit" to review.</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={!parsedData || submitting}
                >
                  Preview & Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!parsedData || submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving & Migrating...
                    </>
                  ) : (
                    'Save & Complete Step 2'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Preview/Edit Mode */
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Review the extracted data below. You can edit fields before saving.
                  This data will be saved to the database and migrated to the companies table.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Business Name
                  </label>
                  <Input
                    value={preview?.businessName || ''}
                    onChange={(e) => {
                      if (parsedData.hero) {
                        parsedData.hero.business_name = e.target.value;
                        setParsedData({...parsedData});
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tagline
                  </label>
                  <Input
                    value={preview?.tagline || ''}
                    onChange={(e) => {
                      if (parsedData.hero) {
                        parsedData.hero.tagline = e.target.value;
                        setParsedData({...parsedData});
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <Input
                    value={preview?.phone || ''}
                    onChange={(e) => {
                      if (parsedData.contact) {
                        parsedData.contact.phone = e.target.value;
                        setParsedData({...parsedData});
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <Input
                    value={preview?.email || ''}
                    onChange={(e) => {
                      if (parsedData.contact) {
                        parsedData.contact.email = e.target.value;
                        setParsedData({...parsedData});
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Website
                  </label>
                  <Input
                    value={preview?.website || ''}
                    onChange={(e) => {
                      if (parsedData.contact) {
                        parsedData.contact.website = e.target.value;
                        setParsedData({...parsedData});
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <Input
                    value={preview?.city || ''}
                    onChange={(e) => {
                      if (parsedData.contact) {
                        parsedData.contact.city = e.target.value;
                        setParsedData({...parsedData});
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    State
                  </label>
                  <Input
                    value={preview?.state || ''}
                    onChange={(e) => {
                      if (parsedData.contact) {
                        parsedData.contact.state = e.target.value;
                        setParsedData({...parsedData});
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  About
                </label>
                <textarea
                  value={preview?.about || ''}
                  onChange={(e) => {
                    if (parsedData.about_and_badges) {
                      parsedData.about_and_badges.about_text = e.target.value;
                      setParsedData({...parsedData});
                    }
                  }}
                  className="w-full h-32 p-3 border rounded-lg"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setError('');
                  }}
                  disabled={submitting}
                >
                  Back to Paste
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving & Migrating...
                    </>
                  ) : (
                    'Save & Complete Step 2'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
