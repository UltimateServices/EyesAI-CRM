'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Loader2, Camera, CheckCircle2, Info } from 'lucide-react';
import MediaGallery from '@/components/company/media-gallery';
import { useStore } from '@/lib/store';

interface ScreenshotsModalProps {
  companyId: string;
  companyName: string;
  profileUrl?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScreenshotsModal({
  companyId,
  companyName,
  profileUrl,
  onClose,
  onSuccess
}: ScreenshotsModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const companies = useStore((state) => state.companies);

  const company = companies.find(c => c.id === companyId);

  // Fetch screenshot count
  useEffect(() => {
    const fetchScreenshotCount = async () => {
      try {
        const response = await fetch(`/api/media?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          const media = data.data || [];

          // Count Eyes Content only
          const screenshots = media.filter((m: any) =>
            m.status === 'active' && m.category === 'eyes-content'
          );
          setScreenshotCount(screenshots.length);
        }
      } catch (err) {
        console.error('Error fetching screenshots:', err);
      }
    };

    fetchScreenshotCount();

    // Refresh every 5 seconds to pick up uploads
    const interval = setInterval(fetchScreenshotCount, 5000);
    return () => clearInterval(interval);
  }, [companyId]);

  const handleMarkComplete = async () => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/onboarding/steps/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: 6, completed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark step as complete');
      }

      alert(`✅ Step 6 completed! ${screenshotCount} screenshot(s) saved for video creation.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`❌ Error: ${err.message || 'Failed to complete step'}`);
      setSubmitting(false);
    }
  };

  if (!company) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="p-6">
          <p className="text-red-600">Company not found</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-7xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
            <div>
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-900">Step 6: Profile Screenshots</h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Company: <span className="font-semibold">{companyName}</span>
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <p className="text-slate-600">
                  Screenshots saved: <span className="font-semibold text-blue-600">{screenshotCount}</span>
                </p>
              </div>
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

          {/* Instructions */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Take these screenshots for the welcome video:</p>
                <ol className="space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Directory Search:</strong> Go to{' '}
                    <a
                      href="https://eyesai.webflow.io/business-directory"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-700"
                    >
                      Business Directory
                    </a>
                    , search "{companyName}", capture the listing result
                  </li>
                  <li>
                    <strong>Live Profile:</strong> Go to{' '}
                    {profileUrl ? (
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-700"
                      >
                        their profile
                      </a>
                    ) : (
                      'their profile page'
                    )}
                    , take a full-page screenshot
                  </li>
                </ol>
                <p className="mt-3 text-blue-800">
                  💡 <strong>Tip:</strong> These screenshots will be used as background images in Scenes 1 & 2 of the HeyGen video.
                </p>
              </div>
            </div>
          </div>

          {/* Media Gallery Component - Full gallery */}
          <div className="mb-6">
            <MediaGallery company={company} />
          </div>

          {/* Success Indicator */}
          {screenshotCount >= 2 && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                Great! You have {screenshotCount} screenshot(s) uploaded and ready for video creation.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t sticky bottom-0 bg-white">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Close
            </Button>
            <Button
              onClick={handleMarkComplete}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Completing...
                </>
              ) : (
                'Mark Step 6 Complete'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
