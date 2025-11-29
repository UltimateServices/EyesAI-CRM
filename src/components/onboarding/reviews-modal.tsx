'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Reviews } from '@/components/company/reviews';
import { useStore } from '@/lib/store';

interface ReviewsModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewsModal({ companyId, companyName, onClose, onSuccess }: ReviewsModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reviewCount, setReviewCount] = useState(0);
  const companies = useStore((state) => state.companies);
  const reviews = useStore((state) => state.reviews);
  const fetchReviews = useStore((state) => state.fetchReviews);

  const company = companies.find(c => c.id === companyId);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const companyReviews = reviews.filter(r => r.companyId === companyId);
    setReviewCount(companyReviews.length);
  }, [reviews, companyId]);

  const handleMarkComplete = async () => {
    if (reviewCount < 5) {
      setError(`You need at least 5 reviews. Currently have ${reviewCount}.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/onboarding/steps/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: 3, completed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark step as complete');
      }

      alert(`✅ Step 3 completed! ${reviewCount} reviews verified.`);
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-7xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Step 3: Reviews</h2>
              <p className="text-sm text-slate-600 mt-1">
                Company: <span className="font-semibold">{companyName}</span>
              </p>
              <p className="text-sm text-slate-600">
                Current: <span className="font-semibold">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                {reviewCount < 5 && <span className="text-red-600 ml-2">(Need 5 reviews minimum)</span>}
                {reviewCount >= 5 && <span className="text-green-600 ml-2">✓ Ready to complete</span>}
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

          {/* Reviews Component */}
          <div className="mb-6">
            <Reviews company={company} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success Indicator */}
          {reviewCount >= 5 && !error && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-4">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">You have {reviewCount} reviews. Ready to mark Step 3 as complete!</p>
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
              disabled={submitting || reviewCount < 5}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Completing...
                </>
              ) : (
                'Mark Step 3 Complete'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
