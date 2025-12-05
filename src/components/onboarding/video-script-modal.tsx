'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Loader2, FileText, CheckCircle2, Info, RefreshCw, Sparkles } from 'lucide-react';
import MediaGallery from '@/components/company/media-gallery';
import { useStore } from '@/lib/store';

interface VideoScriptModalProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function VideoScriptModal({
  companyId,
  companyName,
  onClose,
  onSuccess
}: VideoScriptModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [script, setScript] = useState<{
    scene1: string;
    scene2: string;
    scene3: string;
    scene4: string;
  } | null>(null);
  const companies = useStore((state) => state.companies);
  const company = companies.find(c => c.id === companyId);

  // Fetch latest company data on mount to check for existing script
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}`);
        if (response.ok) {
          const { data } = await response.json();
          if (data?.video_script) {
            setScript(data.video_script);
          }
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  const handleGenerateScript = async (regenerate = false) => {
    setLoading(true);
    try {
      const response = await fetch('/api/onboarding/video-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, regenerate }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate script');
      }

      const data = await response.json();
      setScript(data.script);
      alert(`✅ ${data.message}`);
    } catch (err: any) {
      alert(`❌ Error: ${err.message || 'Failed to generate script'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!script) return;

    setSubmitting(true);
    try {
      // Save script changes to database
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_script: script }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      alert('✅ Script changes saved!');
    } catch (err: any) {
      alert(`❌ Error: ${err.message || 'Failed to save changes'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!script) {
      alert('⚠️ Please generate a script first before marking this step as complete.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/onboarding/steps/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: 7, completed: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark step as complete');
      }

      alert(`✅ Step 7 completed! Video script is ready for HeyGen.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`❌ Error: ${err.message || 'Failed to complete step'}`);
      setSubmitting(false);
    }
  };

  const handleSceneChange = (scene: 'scene1' | 'scene2' | 'scene3' | 'scene4', value: string) => {
    if (script) {
      setScript({ ...script, [scene]: value });
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
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Step 7: Video Script & Generation</h2>
                <p className="text-xs text-slate-600">{companyName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading || submitting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Instructions - Compact */}
          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-purple-900">
                <p className="font-semibold mb-1">AI generates 4-scene script using Step 2 data → Review & edit → Use screenshots below in HeyGen</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {initialLoading && (
            <div className="mb-4 flex items-center justify-center gap-3 py-6 bg-slate-50 rounded-lg border border-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm text-slate-600">Loading script...</span>
            </div>
          )}

          {/* Generate Script Section - Compact */}
          {!script && !initialLoading && (
            <div className="mb-4 flex items-center justify-center gap-3 py-6 bg-slate-50 rounded-lg border border-slate-200">
              <Button
                onClick={() => handleGenerateScript(false)}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Script
                  </>
                )}
              </Button>
              <span className="text-sm text-slate-600">Click to generate 4-scene video script</span>
            </div>
          )}

          {/* Script Editor Section - Compact */}
          {script && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">Video Script (4 Scenes)</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateScript(true)}
                    disabled={loading || submitting}
                    className="gap-1 text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={loading || submitting}
                    className="gap-1 text-xs"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Scene 1 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scene 1: Welcome (~14 sec) <span className="font-normal text-slate-500">- Avatar on laptop</span>
                </label>
                <textarea
                  value={script.scene1}
                  onChange={(e) => handleSceneChange('scene1', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={loading || submitting}
                />
              </div>

              {/* Scene 2 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scene 2: Profile Reveal (~23 sec) <span className="font-normal text-slate-500">- Avatar + profile screenshot</span>
                </label>
                <textarea
                  value={script.scene2}
                  onChange={(e) => handleSceneChange('scene2', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={loading || submitting}
                />
              </div>

              {/* Scene 3 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scene 3: Network Growth (~21 sec) <span className="font-normal text-slate-500">- Avatar + EYESAI graphics</span>
                </label>
                <textarea
                  value={script.scene3}
                  onChange={(e) => handleSceneChange('scene3', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={loading || submitting}
                />
              </div>

              {/* Scene 4 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scene 4: Closing & CTA (~16 sec) <span className="font-normal text-slate-500">- Avatar + CTA graphics</span>
                </label>
                <textarea
                  value={script.scene4}
                  onChange={(e) => handleSceneChange('scene4', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={loading || submitting}
                />
              </div>
            </div>
          )}

          {/* Eyes Content Gallery Section - Compact */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-900">Eyes Content</h3>
              <p className="text-xs text-slate-600">Drag to HeyGen Scenes 1 & 2</p>
            </div>
            <div className="border border-slate-200 rounded overflow-hidden">
              <MediaGallery company={company} />
            </div>
          </div>

          {/* Success Indicator - Compact */}
          {script && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 mb-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs">
                Script ready! Review, edit if needed, then mark step complete.
              </p>
            </div>
          )}

          {/* Footer Actions - Compact */}
          <div className="flex gap-2 justify-end pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading || submitting}
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleMarkComplete}
              disabled={loading || submitting || !script}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Completing...
                </>
              ) : (
                'Mark Step 7 Complete'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
