'use client';

import { useState } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, FileText, Video, ExternalLink, Edit, Twitter, Facebook, Instagram, Music2 } from 'lucide-react';
import { Company } from '@/lib/types';

interface MonthlyDeliverablesProps {
  company: Company;
}

export function MonthlyDeliverables({ company }: MonthlyDeliverablesProps) {
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  
  // Calculate due date (30 days from created date)
  const createdDate = new Date(company.createdAt || new Date());
  const dueDate = new Date(createdDate);
  dueDate.setDate(dueDate.getDate() + 30);
  
  // Determine if it's a Discover or Verified package
  const isVerified = company.plan === 'verified';
  
  // Mock deliverables data - TODO: Connect to actual backend
  const deliverables = {
    discover: [
      {
        id: 'blog',
        title: 'SEO Blog',
        quantity: 1,
        status: 'in_progress' as const,
        icon: FileText,
        dueDate: dueDate,
        hasReviewCheckbox: true,
        reviewEmbedded: false,
        link: '',
        startedDate: '2025-10-18'
      },
      {
        id: 'video',
        title: 'Marketing Video',
        quantity: 1,
        status: 'completed' as const,
        icon: Video,
        dueDate: dueDate,
        hasReviewCheckbox: true,
        reviewEmbedded: true,
        link: 'https://youtube.com/watch?v=xyz',
        completedDate: '2025-10-15'
      },
      {
        id: 'facebook',
        title: 'Facebook Post',
        quantity: 1,
        status: 'not_started' as const,
        icon: Facebook,
        dueDate: dueDate,
        link: ''
      },
      {
        id: 'twitter',
        title: 'Twitter/X Post',
        quantity: 1,
        status: 'not_started' as const,
        icon: Twitter,
        dueDate: dueDate,
        link: ''
      }
    ],
    verified: [
      {
        id: 'citation',
        title: 'Citation',
        quantity: 1,
        status: 'not_started' as const,
        icon: ExternalLink,
        dueDate: dueDate,
        link: ''
      },
      {
        id: 'instagram',
        title: 'Instagram Post',
        quantity: 1,
        status: 'not_started' as const,
        icon: Instagram,
        dueDate: dueDate,
        link: ''
      },
      {
        id: 'tiktok',
        title: 'TikTok Post',
        quantity: 1,
        status: 'not_started' as const,
        icon: Music2,
        dueDate: dueDate,
        link: ''
      },
      {
        id: 'youtube_short',
        title: 'YouTube Shorts',
        quantity: 1,
        status: 'not_started' as const,
        icon: Video,
        dueDate: dueDate,
        link: ''
      }
    ]
  };
  
  const activeDeliverables = [
    ...deliverables.discover,
    ...(isVerified ? deliverables.verified : [])
  ];
  
  const totalTasks = activeDeliverables.length;
  const completedTasks = activeDeliverables.filter(d => d.status === 'completed').length;
  const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
  
  const StatusBadge = ({ status }: { status: 'not_started' | 'in_progress' | 'completed' }) => {
    const statusConfig = {
      not_started: {
        emoji: '🔴',
        label: 'Not Started',
        bgClass: 'bg-red-100',
        textClass: 'text-red-700',
        borderClass: 'border-red-200'
      },
      in_progress: {
        emoji: '🟡',
        label: 'In Progress',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-700',
        borderClass: 'border-yellow-200'
      },
      completed: {
        emoji: '🟢',
        label: 'Completed',
        bgClass: 'bg-green-100',
        textClass: 'text-green-700',
        borderClass: 'border-green-200'
      }
    };
    
    const config = statusConfig[status];
    
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass} font-medium text-sm`}>
        <span className="text-base">{config.emoji}</span>
        <span>{config.label}</span>
      </div>
    );
  };
  
  const DeliverableCard = ({ deliverable }: { deliverable: any }) => {
    const Icon = deliverable.icon;
    const isCompleted = deliverable.status === 'completed';
    const isInProgress = deliverable.status === 'in_progress';
    
    return (
      <div className={`bg-white rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
        isCompleted ? 'border-green-200 bg-green-50/50' : 'border-slate-200'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl ${
              isCompleted ? 'bg-green-100' : isInProgress ? 'bg-yellow-100' : 'bg-slate-100'
            }`}>
              <Icon className={`w-6 h-6 ${
                isCompleted ? 'text-green-600' : isInProgress ? 'text-yellow-600' : 'text-slate-600'
              }`} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {deliverable.title}
              </h3>
              
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <StatusBadge status={deliverable.status} />
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Due: {deliverable.dueDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              {deliverable.hasReviewCheckbox && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    deliverable.reviewEmbedded 
                      ? 'bg-green-500 border-green-500' 
                      : 'bg-white border-slate-300'
                  }`}>
                    {deliverable.reviewEmbedded && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm text-slate-700 font-medium">
                    Review embedded: {deliverable.reviewEmbedded ? '✓' : '—'}
                  </span>
                </div>
              )}
              
              {deliverable.link && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <a href={deliverable.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                    View Published Content →
                  </a>
                </div>
              )}
              
              {(deliverable.startedDate || deliverable.completedDate) && (
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {deliverable.completedDate ? (
                    <span>Completed: {deliverable.completedDate}</span>
                  ) : deliverable.startedDate ? (
                    <span>Started: {deliverable.startedDate}</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
          {deliverable.status === 'not_started' && (
            <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-all shadow-sm hover:shadow-md">
              Start Working
            </button>
          )}
          
          {deliverable.status === 'in_progress' && (
            <button className="px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-semibold text-sm transition-all shadow-sm hover:shadow-md">
              Continue
            </button>
          )}
          
          {deliverable.status === 'completed' && (
            <button className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-semibold text-sm transition-all flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          
          <button className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold text-sm transition-all">
            View Details
          </button>
        </div>
      </div>
    );
  };
  
  const allComplete = completedTasks === totalTasks;
  
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-7 h-7" />
              <h2 className="text-3xl font-bold">Monthly Deliverables</h2>
            </div>
            <p className="text-blue-100 text-lg">
              Track and manage all content deliverables for {company.name}
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/30">
            <div className="text-sm text-blue-100 mb-1 font-medium">Package</div>
            <div className="text-xl font-bold capitalize">{company.plan || 'discover'}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-5 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-semibold cursor-pointer hover:bg-white/30 transition-all"
          >
            <option value="2025-10" className="text-slate-900">October 2025</option>
            <option value="2025-09" className="text-slate-900">September 2025</option>
            <option value="2025-08" className="text-slate-900">August 2025</option>
          </select>
          
          <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Due: {dueDate.toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* Progress Card */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Overall Progress</h3>
            <p className="text-sm text-slate-600">
              {completedTasks} of {totalTasks} deliverables completed
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{progressPercentage}%</div>
            <div className="text-sm text-slate-500 font-medium">Complete</div>
          </div>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 rounded-full shadow-sm"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Deliverables Grid */}
      <div className="space-y-4">
        {activeDeliverables.map((deliverable) => (
          <DeliverableCard key={deliverable.id} deliverable={deliverable} />
        ))}
      </div>
      
      {/* Monthly Report Section */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              Monthly Client Report
            </h3>
            <p className="text-sm text-slate-600">
              Generate and send the monthly performance report to your client
            </p>
          </div>
          
          {allComplete && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
              <CheckCircle className="w-5 h-5" />
              All Tasks Complete
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
          <button
            disabled={!allComplete}
            className={`px-8 py-3.5 rounded-xl font-bold transition-all text-sm ${
              allComplete
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Generate Report
          </button>
          
          <button
            disabled={!allComplete}
            className={`px-8 py-3.5 rounded-xl font-bold transition-all text-sm ${
              allComplete
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 hover:shadow-xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Send via Klaviyo
          </button>
          
          <div className="ml-auto text-sm text-slate-500">
            Last Sent: <span className="font-bold text-slate-700">October 1, 2025</span>
          </div>
        </div>
        
        {!allComplete && (
          <div className="mt-6 p-5 bg-yellow-50 border-2 border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-bold mb-1">Report generation is disabled</p>
              <p>Complete all deliverables before generating the monthly report.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}