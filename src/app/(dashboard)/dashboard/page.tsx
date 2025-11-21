'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Plus,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Loader2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const companies = useStore((state) => state.companies);
  const fetchCompanies = useStore((state) => state.fetchCompanies);
  const initializeOrganization = useStore((state) => state.initializeOrganization);
  const currentOrganization = useStore((state) => state.currentOrganization);

  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await initializeOrganization();
      await fetchCompanies();
      setLoading(false);
    };
    init();
  }, [initializeOrganization, fetchCompanies]);

  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const pendingCompanies = companies.filter(c => c.status === 'pending').length;

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const today = new Date();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back! Here's what's happening with your clients.
          </p>
        </div>
        <Button
          onClick={() => router.push('/companies/new')}
          className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      {/* Performance Stats Row */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/60">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Performance Overview</h2>
            <p className="text-sm text-slate-500">{monthNames[today.getMonth()]} {today.getFullYear()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              This Month
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Total Companies</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{companies.length}</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +12%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-slate-500">Active</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{activeCompanies}</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +8%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-slate-500">Pending Review</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{pendingCompanies}</span>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center">
                <AlertCircle className="w-3 h-3 mr-0.5" />
                Needs attention
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-slate-500">Completed Tasks</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">24</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                On track
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Companies - Takes 2 columns */}
        <Card className="lg:col-span-2 p-6 bg-white/80 backdrop-blur-sm border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Recent Companies</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/companies')} className="text-blue-600 hover:text-blue-700">
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No companies yet</h3>
              <p className="text-slate-500 mb-4">Get started by adding your first company</p>
              <Button onClick={() => router.push('/companies/new')} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Company
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.slice(0, 5).map((company) => (
                <div
                  key={company.id}
                  onClick={() => router.push(`/companies/${company.id}`)}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-all group"
                >
                  {company.logoUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-100 bg-white flex items-center justify-center flex-shrink-0">
                      <img
                        src={company.logoUrl}
                        alt={`${company.name} logo`}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {company.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{company.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{company.website || company.address || 'No details'}</p>
                  </div>
                  <Badge className={`
                    ${company.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      company.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'}
                    border font-medium
                  `}>
                    {company.status || 'active'}
                  </Badge>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Calendar Widget */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-slate-200/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Schedule</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-4">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</p>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
              <div key={day} className="text-xs font-medium text-slate-400 py-2">{day}</div>
            ))}
            {Array.from({ length: startingDay === 0 ? 6 : startingDay - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="py-2"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = today.getDate() === day &&
                today.getMonth() === currentMonth.getMonth() &&
                today.getFullYear() === currentMonth.getFullYear();
              return (
                <div
                  key={day}
                  className={`
                    py-2 text-sm rounded-lg cursor-pointer transition-colors
                    ${isToday
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white font-medium'
                      : 'text-slate-700 hover:bg-slate-100'}
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Upcoming Events */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <p className="text-xs font-medium text-slate-500 mb-3">TODAY</p>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                <p className="font-medium text-slate-900 text-sm">Review Client Reports</p>
                <p className="text-xs text-slate-500 mt-1">10:00 - 11:00 AM</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <p className="font-medium text-slate-900 text-sm">Content Planning</p>
                <p className="text-xs text-slate-500 mt-1">2:00 - 3:00 PM</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="p-5 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer transition-all group"
          onClick={() => router.push('/companies/new')}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-slate-900">New Company</h3>
          <p className="text-sm text-slate-500 mt-1">Add a new client</p>
        </Card>

        <Card
          className="p-5 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer transition-all group"
          onClick={() => router.push('/companies')}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-medium text-slate-900">All Companies</h3>
          <p className="text-sm text-slate-500 mt-1">View & manage</p>
        </Card>

        <Card className="p-5 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-medium text-slate-900">Reports</h3>
          <p className="text-sm text-slate-500 mt-1">View analytics</p>
        </Card>

        <Card className="p-5 bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer transition-all group">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-medium text-slate-900">Schedule</h3>
          <p className="text-sm text-slate-500 mt-1">Plan tasks</p>
        </Card>
      </div>
    </div>
  );
}