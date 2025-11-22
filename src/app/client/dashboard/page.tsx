'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  BarChart3,
  TrendingUp,
  Eye,
  MessageSquare,
  ArrowUpRight,
  Calendar
} from 'lucide-react';

const supabase = createClientComponentClient();

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const stats = [
    {
      label: 'Total Views',
      value: '12,847',
      change: '+12.5%',
      icon: Eye,
      color: 'from-sky-500 to-blue-500'
    },
    {
      label: 'AI Mentions',
      value: '342',
      change: '+8.2%',
      icon: MessageSquare,
      color: 'from-blue-500 to-indigo-500'
    },
    {
      label: 'Growth Rate',
      value: '23.5%',
      change: '+5.1%',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      label: 'Reports Generated',
      value: '18',
      change: '+3',
      icon: BarChart3,
      color: 'from-purple-500 to-pink-500'
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your AI presence.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {stat.change}
                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
            <button className="text-sm text-sky-600 hover:text-sky-700 font-medium">View all</button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Monthly AI Visibility Report', date: 'Nov 20, 2024', status: 'Ready' },
              { title: 'Competitor Analysis', date: 'Nov 18, 2024', status: 'Ready' },
              { title: 'Content Performance', date: 'Nov 15, 2024', status: 'Ready' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{report.title}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {report.date}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Mentions Feed */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent AI Mentions</h2>
            <button className="text-sm text-sky-600 hover:text-sky-700 font-medium">View all</button>
          </div>
          <div className="space-y-4">
            {[
              { source: 'ChatGPT', query: '"Best services in your area"', time: '2 hours ago' },
              { source: 'Claude', query: '"Top rated companies"', time: '5 hours ago' },
              { source: 'Perplexity', query: '"Recommended providers"', time: '1 day ago' },
            ].map((mention, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-slate-50/80 rounded-xl">
                <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-500 rounded-lg shadow-sm">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{mention.source}</span>
                    <span className="text-xs text-slate-400">{mention.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{mention.query}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
