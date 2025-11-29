'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import MediaGallery from '@/components/company/media-gallery';
import { useStore } from '@/lib/store';

interface MediaModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function MediaModal({ companyId, companyName, onClose, onSuccess }: MediaModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logoCount, setLogoCount] = useState(0);
  const [galleryCount, setGalleryCount] = useState(0);
  const companies = useStore((state) => state.companies);

  const company = companies.find(c => c.id === companyId);

  // Fetch media counts
  useEffect(() => {
    const fetchMediaCounts = async () => {
      try {
        const response = await fetch(`/api/media?companyId=${companyId}`);
        if (response.ok) {
          const data = await response.json();
          const media = data.data || [];

          // Count logo items (case-insensitive) - only active status
          const logos = media.filter((m: any) =>
            m.status === 'active' && m.internal_tags?.some((tag: string) => tag.toLowerCase() === 'logo')
          );
          setLogoCount(logos.length);

          // Count gallery items (any categorized image that's NOT a logo) - only active status
          const gallery = media.filter((m: any) =>
            m.status === 'active' &&
            m.internal_tags?.length > 0 &&
            !m.internal_tags?.some((tag: string) => tag.toLowerCase() === 'logo')
          );
          setGalleryCount(gallery.length);
        }
      } catch (err) {
        console.error('Error fetching media:', err);
      }
    };

    fetchMediaCounts();

    // Refresh every 5 seconds to pick up uploads
    const interval = setInterval(fetchMediaCounts, 5000);
    return () => clearInterval(interval);
  }, [companyId]);

  const handleMarkComplete = async () => {
    if (logoCount < 1) {
      setError('You need at least 1 logo image.');
      return;
    }

    if (galleryCount < 5) {
      setError(`You need at least 5 gallery images. Currently have ${galleryCount}.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/onboarding/steps/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: 4, completed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark step as complete');
      }

      alert(`✅ Step 4 completed! ${logoCount} logo and ${galleryCount} gallery images verified.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to complete step');
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

  const isReady = logoCount >= 1 && galleryCount >= 5;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-7xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Step 4: Logo & Media Library</h2>
              <p className="text-sm text-slate-600 mt-1">
                Company: <span className="font-semibold">{companyName}</span>
              </p>
              <div className="flex gap-4 mt-2 text-sm">
                <p className="text-slate-600">
                  Logo: <span className="font-semibold">{logoCount}</span>
                  {logoCount < 1 && <span className="text-red-600 ml-1">(Need 1)</span>}
                  {logoCount >= 1 && <span className="text-green-600 ml-1">✓</span>}
                </p>
                <p className="text-slate-600">
                  Gallery: <span className="font-semibold">{galleryCount} image{galleryCount !== 1 ? 's' : ''}</span>
                  {galleryCount < 5 && <span className="text-red-600 ml-1">(Need 5)</span>}
                  {galleryCount >= 5 && <span className="text-green-600 ml-1">✓</span>}
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

          {/* Media Gallery Component */}
          <div className="mb-6">
            <MediaGallery company={company} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success Indicator */}
          {isReady && !error && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                You have {logoCount} logo and {galleryCount} gallery images. Ready to mark Step 4 as complete!
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
              disabled={submitting || !isReady}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Completing...
                </>
              ) : (
                'Mark Step 4 Complete'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
