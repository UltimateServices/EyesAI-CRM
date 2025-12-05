'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Video,
  MessageSquare,
  MapPin,
  Link as LinkIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Eye,
  Send,
  Plus
} from 'lucide-react';

interface Deliverable {
  id: string;
  type: string;
  status: string;
  title?: string;
  scheduled_publish_date?: string;
  published_at?: string;
}

interface DeliverableMonth {
  id: string;
  month_number: number;
  cycle_start_date: string;
  cycle_end_date: string;
  status: string;
}

interface DeliverablesListProps {
  companyId: string;
  packageType: 'discover' | 'verified';
  companyName: string;
  companyLogo?: string;
  profileSlug?: string;
}

const deliverableConfig: Record<string, { label: string; icon: any; color: string }> = {
  seo_blog: { label: 'SEO Blog', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  marketing_video: { label: 'Marketing Video', icon: Video, color: 'bg-purple-100 text-purple-700' },
  review_highlight: { label: 'Review Highlight', icon: MessageSquare, color: 'bg-yellow-100 text-yellow-700' },
  social_fb: { label: 'Facebook Post', icon: MessageSquare, color: 'bg-blue-100 text-blue-700' },
  social_x: { label: 'X Post', icon: MessageSquare, color: 'bg-slate-100 text-slate-700' },
  social_ig: { label: 'Instagram Post', icon: MessageSquare, color: 'bg-pink-100 text-pink-700' },
  social_tiktok: { label: 'TikTok Video', icon: Video, color: 'bg-slate-100 text-slate-700' },
  social_yt: { label: 'YouTube Short', icon: Video, color: 'bg-red-100 text-red-700' },
  citation: { label: 'Citation', icon: MapPin, color: 'bg-green-100 text-green-700' },
  backlink: { label: 'Backlink', icon: LinkIcon, color: 'bg-indigo-100 text-indigo-700' },
  report_basic: { label: 'Monthly Report', icon: BarChart3, color: 'bg-slate-100 text-slate-700' },
  report_expanded: { label: 'Expanded Report', icon: BarChart3, color: 'bg-slate-100 text-slate-700' },
  marketing_recommendations: { label: 'Marketing Recommendations', icon: FileText, color: 'bg-orange-100 text-orange-700' }
};

const statusConfig: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  not_started: {
    label: 'Not Started',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200'
  },
  draft: {
    label: 'Draft',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200'
  },
  in_review: {
    label: 'In Review',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200'
  },
  published: {
    label: 'Published',
    bgColor: 'bg-emerald-500',
    textColor: 'text-white',
    borderColor: 'border-emerald-600'
  }
};

export function DeliverablesList({ companyId, packageType, companyName, companyLogo, profileSlug }: DeliverablesListProps) {
  const [months, setMonths] = useState<DeliverableMonth[]>([]);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (months.length > 0) {
      fetchDeliverables(months[currentMonthIndex].id);
    }
  }, [currentMonthIndex, months]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch months
      const monthsRes = await fetch(`/api/deliverables/${companyId}/months`);
      if (monthsRes.ok) {
        const monthsData = await monthsRes.json();

        // If no months exist, initialize the cycle
        if (!monthsData.months || monthsData.months.length === 0) {
          console.log('No monthly cycles found, initializing...');
          const initRes = await fetch('/api/deliverables/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId })
          });

          if (initRes.ok) {
            console.log('Monthly cycle initialized successfully');
            // Fetch months again after initialization
            const retryRes = await fetch(`/api/deliverables/${companyId}/months`);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setMonths(retryData.months || []);
              if (retryData.months && retryData.months.length > 0) {
                fetchDeliverables(retryData.months[0].id);
              }
            }
          } else {
            const error = await initRes.json();
            console.error('Failed to initialize monthly cycle:', error);
          }
        } else {
          setMonths(monthsData.months || []);
          if (monthsData.months && monthsData.months.length > 0) {
            fetchDeliverables(monthsData.months[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching deliverables data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliverables = async (monthId: string) => {
    try {
      const res = await fetch(`/api/deliverables/${companyId}/month/${monthId}`);
      if (res.ok) {
        const data = await res.json();
        setDeliverables(data.deliverables || []);
      }
    } catch (error) {
      console.error('Error fetching deliverables:', error);
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIndex < months.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const currentMonth = months[currentMonthIndex];
  const cycleStart = currentMonth ? new Date(currentMonth.cycle_start_date) : null;
  const cycleEnd = currentMonth ? new Date(currentMonth.cycle_end_date) : null;
  const today = new Date();
  const daysElapsed = cycleStart ? Math.floor((today.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const daysTotal = 28;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No monthly cycles found.</p>
      </div>
    );
  }

  // Calculate progress
  const completedCount = deliverables.filter(d => d.status === 'published').length;
  const totalCount = deliverables.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const cyclePercentage = Math.min(Math.round((daysElapsed / daysTotal) * 100), 100);

  const profileUrl = profileSlug ? `https://eyesai.ai/profile/${profileSlug}` : null;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 p-6 shadow-sm">
        {/* Row 1: Company Info */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Logo */}
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border border-slate-200">
                <span className="text-lg font-bold text-blue-600">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Company Name & Profile Link */}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{companyName}</h3>
              {profileUrl && (
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 mt-1"
                >
                  eyesai.ai/profile/{profileSlug}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Package Badge */}
          <Badge className={packageType === 'verified' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}>
            {packageType === 'verified' ? 'Verified' : 'Discover'}
          </Badge>
        </div>

        {/* Row 2: Month Navigation & Progress */}
        <div className="grid grid-cols-3 gap-6 p-4 bg-white rounded-lg border border-slate-200">
          {/* Month Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={currentMonthIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center flex-1">
              <div className="text-sm font-semibold text-slate-900">
                Month {currentMonth?.month_number}
              </div>
              {cycleStart && cycleEnd && (
                <div className="text-xs text-slate-600">
                  {cycleStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {cycleEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={currentMonthIndex === months.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Deliverables Progress */}
          <div className="flex flex-col justify-center">
            <div className="text-sm font-semibold text-slate-900 mb-1.5">
              {completedCount} of {totalCount} Complete
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Cycle Progress */}
          <div className="flex flex-col justify-center">
            <div className="text-sm font-semibold text-slate-900 mb-1.5">
              Day {Math.min(daysElapsed, daysTotal)} of {daysTotal}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div
                className="bg-slate-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${cyclePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables List */}
      <div className="space-y-3">
        {deliverables.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg">
            <p className="text-slate-600">No deliverables for this month.</p>
          </div>
        ) : (
          deliverables.map((deliverable) => {
            const config = deliverableConfig[deliverable.type] || { label: deliverable.type, icon: FileText, color: 'bg-slate-100 text-slate-600' };
            const status = statusConfig[deliverable.status] || statusConfig.not_started;
            const Icon = config.icon;
            const isPublished = deliverable.status === 'published';

            return (
              <div
                key={deliverable.id}
                className="group relative flex items-center justify-between p-5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200"
              >
                {/* Checkbox/Checkmark */}
                <div className="absolute left-5 top-5">
                  {isPublished ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-blue-400 transition-colors"></div>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-1 ml-9">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl ${config.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Deliverable Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h5 className="font-semibold text-slate-900">{config.label}</h5>
                      <Badge className={`${status.bgColor} ${status.textColor} border ${status.borderColor} font-medium`}>
                        {status.label}
                      </Badge>
                    </div>
                    {deliverable.scheduled_publish_date && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Scheduled: {new Date(deliverable.scheduled_publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {deliverable.status === 'not_started' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm font-medium"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                      {(deliverable.type === 'citation' || deliverable.type === 'backlink') && (
                        <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                          <Plus className="w-4 h-4 mr-2" />
                          Add URL
                        </Button>
                      )}
                    </>
                  )}
                  {deliverable.status === 'draft' && (
                    <>
                      <Button size="sm" variant="ghost" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium">
                        <Send className="w-4 h-4 mr-2" />
                        Publish
                      </Button>
                    </>
                  )}
                  {deliverable.status === 'published' && deliverable.published_at && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Published {new Date(deliverable.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
