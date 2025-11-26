'use client';

import { useState } from 'react';
import { Download, FileText, Calendar, ChevronDown, ChevronRight, Play, CheckCircle2, Clock, FolderOpen, Search } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function ContentLibraryPage() {
  const [expandedMonth, setExpandedMonth] = useState<string | null>('November 2024');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const contentByMonth = [
    {
      month: 'November 2024',
      items: [
        { id: 1, title: 'Weekly AI Visibility Report - Week 47', type: 'PDF Report', status: 'ready', date: 'Nov 20, 2024' },
        { id: 2, title: 'Dumpster Rental Keywords Analysis', type: 'PDF Report', status: 'ready', date: 'Nov 18, 2024' },
        { id: 3, title: 'AI Response Optimization Video', type: 'Video', status: 'processing', date: 'Nov 15, 2024' },
        { id: 4, title: 'Houston Market Competitor Report', type: 'PDF Document', status: 'ready', date: 'Nov 10, 2024' },
      ]
    },
    {
      month: 'October 2024',
      items: [
        { id: 5, title: 'Q3 AI Visibility Summary', type: 'PDF Report', status: 'ready', date: 'Oct 28, 2024' },
        { id: 6, title: 'Roll-Off Dumpster Content Strategy', type: 'PDF Document', status: 'ready', date: 'Oct 20, 2024' },
        { id: 7, title: 'Customer Success Story - Construction Co.', type: 'Video', status: 'ready', date: 'Oct 15, 2024' },
      ]
    },
    {
      month: 'September 2024',
      items: [
        { id: 8, title: 'Waste Management Industry AI Trends', type: 'PDF Report', status: 'ready', date: 'Sep 25, 2024' },
        { id: 9, title: 'Service Area Expansion Recommendations', type: 'PDF Document', status: 'ready', date: 'Sep 20, 2024' },
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'ready') {
      return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
          isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
        }`}>
          <CheckCircle2 className="w-3 h-3" />
          Ready
        </span>
      );
    }
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
        isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
      }`}>
        <Clock className="w-3 h-3" />
        Processing
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Content Library</h1>
          <p className={`mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Access your monthly content and deliverables</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search content..."
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
              isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Files', value: '24', icon: FileText, color: 'sky' },
          { label: 'Ready', value: '22', icon: CheckCircle2, color: 'emerald' },
          { label: 'Processing', value: '2', icon: Clock, color: 'amber' },
          { label: 'This Month', value: '4', icon: Calendar, color: 'purple' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`backdrop-blur-sm rounded-2xl p-5 border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  stat.color === 'sky' ? isDark ? 'bg-sky-500/20' : 'bg-sky-100' :
                  stat.color === 'emerald' ? isDark ? 'bg-emerald-500/20' : 'bg-emerald-100' :
                  stat.color === 'amber' ? isDark ? 'bg-amber-500/20' : 'bg-amber-100' :
                  isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    stat.color === 'sky' ? isDark ? 'text-sky-400' : 'text-sky-600' :
                    stat.color === 'emerald' ? isDark ? 'text-emerald-400' : 'text-emerald-600' :
                    stat.color === 'amber' ? isDark ? 'text-amber-400' : 'text-amber-600' :
                    isDark ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <span className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {contentByMonth.map((monthData) => (
          <div key={monthData.month} className={`backdrop-blur-sm rounded-2xl border overflow-hidden ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'
          }`}>
            <button
              onClick={() => setExpandedMonth(expandedMonth === monthData.month ? null : monthData.month)}
              className={`w-full flex items-center justify-between p-5 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-b from-[#38BDF8] to-[#0369A1] shadow-lg shadow-sky-500/20">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{monthData.month}</h3>
                  <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{monthData.items.length} items</p>
                </div>
              </div>
              {expandedMonth === monthData.month ? (
                <ChevronDown className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
              ) : (
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
              )}
            </button>

            {expandedMonth === monthData.month && (
              <div className={`border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                {monthData.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 transition-all ${
                      index !== monthData.items.length - 1 ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100' : ''
                    } ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                        {item.type.includes('Video') ? (
                          <Play className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                        ) : (
                          <FileText className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{item.type} • {item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(item.status)}
                      {item.status === 'ready' && (
                        <button className="p-2.5 bg-gradient-to-b from-[#38BDF8] to-[#0369A1] hover:shadow-lg hover:shadow-sky-500/30 rounded-xl transition-all">
                          <Download className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
