'use client';

import { useEffect, useState } from 'react';
import {
  Crown,
  ExternalLink,
  CheckCircle2,
  Clock,
  TrendingUp,
  Eye,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '../ThemeContext';
import { useCompany } from '../CompanyContext';

export default function ClientDashboard() {
  const { company } = useCompany();
  const [showEyesAILogo, setShowEyesAILogo] = useState(true);
  const [hoveredPlanFeature, setHoveredPlanFeature] = useState<number | null>(null);
  const [hoveredProfileFeature, setHoveredProfileFeature] = useState<number | null>(null);
  const [hoveredDiscoverInfo, setHoveredDiscoverInfo] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const webflowDomain = process.env.NEXT_PUBLIC_WEBFLOW_DOMAIN || 'http://eyesai.webflow.io';

  // Alternate logos every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowEyesAILogo(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const discoverFeatures = [
    {
      name: 'AI-Optimized Business Profile',
      description: 'Your profile is updated each month to keep everything accurate, polished, and AI-ready.'
    },
    {
      name: '1 SEO-Rich Fresh Blog',
      description: 'A new, search-focused blog written and added to your business profile every month.'
    },
    {
      name: '1 YouTube Video',
      description: 'A monthly video created from your blog and published to the EyesAI YouTube channel.'
    },
    {
      name: 'Review Repurposing',
      description: 'Your best recent reviews are turned into new content and added to your profile.'
    },
    {
      name: 'Backlinks from EyesAI Network',
      description: 'Authority-boosting mentions from across the EyesAI Network to increase visibility.'
    },
    {
      name: '1 Social Share to Facebook',
      description: 'A monthly branded post published on the EyesAI Facebook page featuring your business.'
    },
    {
      name: '1 Social Share to X',
      description: 'A monthly branded post published on the EyesAI X (Twitter) account featuring your business.'
    },
    {
      name: 'Monthly Reporting',
      description: 'A simple breakdown of all content produced and visibility gained for the month.'
    },
    {
      name: 'Hands-Off Promise',
      description: 'We handle everything — no work required from you.'
    },
  ];

  const verifiedAdditionalFeatures = [
    {
      name: 'Verified Badge',
      description: 'Your profile receives an official verification badge for added trust and credibility.'
    },
    {
      name: 'Priority Spotlight Rotation',
      description: 'Your business appears more frequently in the rotating EyesAI Spotlight feature.'
    },
    {
      name: '1 Additional Third-Party Citation',
      description: 'Your business is submitted to one new reputable external directory each month.'
    },
    {
      name: 'Monthly FAQ Expansion',
      description: 'One new question and answer added monthly to strengthen AI visibility.'
    },
    {
      name: '1 Instagram Post (EyesAI Channel)',
      description: 'A branded monthly post featuring your business on the EyesAI Instagram page.'
    },
    {
      name: '1 TikTok Post (EyesAI Channel)',
      description: 'A monthly TikTok-style post featuring your business on the EyesAI TikTok account.'
    },
    {
      name: 'Expanded Monthly Report',
      description: 'A deeper analytics breakdown that includes keyword & hashtag suggestions and additional insights.'
    },
    {
      name: '3 Custom Marketing Recommendations',
      description: 'Three personalized monthly suggestions to support your online visibility and strategy.'
    },
    {
      name: 'Enhanced Profile Sections',
      description: 'Additional profile sections unlocked for more depth, more content, and stronger AI discoverability.'
    },
  ];

  // Show loading if company data hasn't loaded yet
  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className={`w-8 h-8 animate-spin mx-auto mb-2 ${isDark ? 'text-white' : 'text-slate-600'}`} />
          <p className={isDark ? 'text-white/60' : 'text-slate-600'}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const planName = company.plan || 'Discover';

  const currentPlan = {
    name: planName,
    status: 'Active',
    renewalDate: 'Dec 15, 2024',
  };

  const stats = [
    { label: 'AI Impressions', value: '24,531', change: '+18.3%', icon: Eye },
    { label: 'AI Recommendations', value: '847', change: '+24.6%', icon: MessageSquare },
    { label: 'Visibility Score', value: '92/100', change: '+8 pts', icon: TrendingUp },
    { label: 'Competitor Rank', value: '#2', change: '+3', icon: BarChart3 },
  ];

  const recentActivity = [
    { action: 'Recommended for "dumpster rental Houston"', source: 'ChatGPT', time: '2 hours ago' },
    { action: 'Mentioned in "best waste management services"', source: 'Claude', time: '5 hours ago' },
    { action: 'Weekly visibility report generated', source: 'System', time: '1 day ago' },
    { action: 'Profile optimized for "roll-off dumpster" queries', source: 'AI Engine', time: '2 days ago' },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className={`text-2xl lg:text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Welcome back, {company.name}
        </h1>
        <p className={`mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Here's an overview of your AI presence.</p>
      </div>

      {/* Top Row: Plan & Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Plan Card */}
        <div className={`backdrop-blur-xl rounded-2xl p-6 border ${
          isDark
            ? 'bg-white/5 border-white/10 shadow-sm'
            : 'bg-white/50 border-sky-200/30 shadow-lg shadow-sky-500/10'
        }`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Current Plan</h2>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Your active subscription</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-lg shadow-cyan-400/60"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping opacity-75"></div>
              </div>
              <span className="text-xs font-medium text-slate-700">Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <img
              src={currentPlan.name === 'Verified' ? '/verified-icon.png' : '/discover-icon.png'}
              alt={currentPlan.name}
              className="h-10 w-auto"
            />
            <span className={`text-2xl font-bold -ml-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentPlan.name}</span>
          </div>

          <Link
            href="/client/upgrade"
            className="w-full py-3 bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all flex items-center justify-center gap-2 border-t border-white/20 mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade Plan
          </Link>

          <div className={`flex items-center gap-2 text-sm mb-6 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            <Clock className="w-4 h-4" />
            <span>Renews on {currentPlan.renewalDate}</span>
          </div>

          <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-sky-200/50'}`}>
            <div className="flex items-start gap-2 mb-3">
              <p className={`text-xs font-semibold ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                {currentPlan.name === 'Verified'
                  ? 'What\'s Included Monthly: Everything in Discover, plus:'
                  : 'What\'s Included Monthly:'}
              </p>
              {currentPlan.name === 'Verified' && (
                <div className="relative flex-shrink-0">
                  <Info
                    className={`w-3 h-3 cursor-help ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}
                    onMouseEnter={(e) => {
                      setHoveredDiscoverInfo(true);
                      const rect = e.currentTarget.getBoundingClientRect();
                      (window as any).discoverIconPos = { x: rect.left, y: rect.top };
                    }}
                    onMouseLeave={() => setHoveredDiscoverInfo(false)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              {currentPlan.name === 'Discover' ? (
                // Show all Discover features for Discover plan
                discoverFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 relative group">
                    <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                    <span className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-700'}`}>{feature.name}</span>
                    <div className="relative">
                      <Info
                        className={`w-3 h-3 cursor-help ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}
                        onMouseEnter={() => setHoveredPlanFeature(index)}
                        onMouseLeave={() => setHoveredPlanFeature(null)}
                      />
                      {hoveredPlanFeature === index && (
                        <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg shadow-xl z-50 text-xs leading-relaxed ${
                          isDark ? 'bg-slate-800 border border-white/10 text-white/90' : 'bg-white border border-slate-200 text-slate-700'
                        }`}>
                          {feature.description}
                          <div className={`absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                            isDark ? 'border-t-slate-800' : 'border-t-white'
                          }`}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                // Show only Verified additional features for Verified plan
                verifiedAdditionalFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 relative group">
                    <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                    <span className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-700'}`}>{feature.name}</span>
                    <div className="relative">
                      <Info
                        className={`w-3 h-3 cursor-help ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}
                        onMouseEnter={() => setHoveredPlanFeature(index)}
                        onMouseLeave={() => setHoveredPlanFeature(null)}
                      />
                      {hoveredPlanFeature === index && (
                        <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg shadow-xl z-50 text-xs leading-relaxed ${
                          isDark ? 'bg-slate-800 border border-white/10 text-white/90' : 'bg-white border border-slate-200 text-slate-700'
                        }`}>
                          {feature.description}
                          <div className={`absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                            isDark ? 'border-t-slate-800' : 'border-t-white'
                          }`}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Profile Link Card */}
        <div className={`backdrop-blur-xl rounded-2xl p-6 border ${
          isDark
            ? 'bg-white/5 border-white/10 shadow-sm'
            : 'bg-white/50 border-sky-200/30 shadow-lg shadow-sky-500/10'
        }`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Business Profile</h2>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Your live AI-optimized profile</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-400/60"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
              </div>
              <span className="text-xs font-medium text-slate-700">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-emerald-500/30 p-1 relative overflow-hidden flex-shrink-0">
              {company.logo_url ? (
                <>
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className={`absolute inset-0 w-full h-full object-contain p-1 transition-opacity duration-500 ${
                      showEyesAILogo ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <img
                    src="/logo.png"
                    alt="EyesAI"
                    className={`absolute inset-0 w-full h-full object-contain p-1 transition-opacity duration-500 ${
                      showEyesAILogo ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </>
              ) : (
                <div className={`w-full h-full rounded-xl flex items-center justify-center text-lg font-bold ${isDark ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'}`}>
                  {company.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{company.name}</span>
          </div>

          <a
            href={company.webflow_slug ? `${webflowDomain}/profile/${company.webflow_slug}` : `${webflowDomain}/profile/${company.profile_slug || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 border-t border-white/20 mb-4"
          >
            <ExternalLink className="w-4 h-4" />
            View Live Profile
          </a>

          <div className={`flex items-center gap-2 text-sm mb-6 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            <ExternalLink className="w-4 h-4" />
            <span>{webflowDomain.replace(/^https?:\/\//, '')}/profile/{company.webflow_slug || company.profile_slug || company.name.toLowerCase().replace(/\s+/g, '-')}</span>
          </div>

          <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-emerald-200/50'}`}>
            <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>What's Included in Profile:</p>
            <div className="space-y-2">
              {[
                {
                  name: 'AI Summary Overview',
                  description: 'A clear, AI-ready business description designed to rank in AI search results and Google Overviews.'
                },
                {
                  name: 'Verified Business Badge',
                  description: 'Confirms your profile is authenticated and trusted across AI discovery platforms.'
                },
                {
                  name: 'Smart Call-To-Actions',
                  description: 'Direct buttons for calls, website visits, map directions, and email — built to convert traffic.'
                },
                {
                  name: 'AI Freshness Signals',
                  description: 'Automated monthly updates that keep your business "active" in the eyes of AI models.'
                },
                {
                  name: 'About & Services Sections',
                  description: 'Professionally written About info + full service/menu list designed for SEO and AI parsing.'
                },
                {
                  name: 'Quick Reference Details',
                  description: 'Pricing snippets, what-to-expect scenarios, and key highlights that help customers decide fast.'
                },
                {
                  name: 'Locations & Contact Info',
                  description: 'Clearly structured location blocks with schema-ready data for ranking and visibility.'
                },
                {
                  name: 'Reviews & Image Gallery',
                  description: 'Curated testimonials and visuals repurposed from your existing online presence.'
                },
                {
                  name: 'Monthly Activity Log',
                  description: 'Shows the blogs, videos, social posts, and updates completed each month by Eyes AI.'
                },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2 relative group">
                  <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-700'}`}>{feature.name}</span>
                  <div className="relative">
                    <Info
                      className={`w-3 h-3 cursor-help ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-400 hover:text-slate-600'}`}
                      onMouseEnter={() => setHoveredProfileFeature(index)}
                      onMouseLeave={() => setHoveredProfileFeature(null)}
                    />
                    {hoveredProfileFeature === index && (
                      <div className={`absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg shadow-xl z-50 text-xs leading-relaxed ${
                        isDark ? 'bg-slate-800 border border-white/10 text-white/90' : 'bg-white border border-slate-200 text-slate-700'
                      }`}>
                        {feature.description}
                        <div className={`absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                          isDark ? 'border-t-slate-800' : 'border-t-white'
                        }`}></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`backdrop-blur-xl rounded-2xl p-5 border ${
                isDark
                  ? 'bg-white/5 border-white/10 shadow-sm'
                  : 'bg-white/50 border-sky-200/30 shadow-lg shadow-sky-500/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-b from-[#38BDF8] to-[#0369A1] shadow-lg shadow-sky-500/30">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  isDark ? 'text-emerald-400 bg-emerald-500/20' : 'text-emerald-600 bg-emerald-100'
                }`}>
                  {stat.change}
                  <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</h3>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className={`backdrop-blur-sm rounded-2xl p-6 border shadow-sm ${
        isDark
          ? 'bg-white/5 border-white/10'
          : 'bg-white/80 border-slate-200/60'
      }`}>
        <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-white/5 border-white/5 hover:bg-white/10'
                  : 'bg-white/40 border-sky-200/20 hover:bg-white/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{activity.action}</p>
                  <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{activity.source}</p>
                </div>
              </div>
              <span className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Discover Info Tooltip - Fixed position to overlap everything */}
      {hoveredDiscoverInfo && (window as any).discoverIconPos && (
        <div
          className={`fixed w-64 p-3 rounded-lg shadow-xl z-[9999] text-xs leading-relaxed ${
            isDark ? 'bg-slate-800 border border-white/10 text-white/90' : 'bg-white border border-slate-200 text-slate-700'
          }`}
          style={{
            left: `${(window as any).discoverIconPos.x}px`,
            top: `${(window as any).discoverIconPos.y - 10}px`,
            transform: 'translateY(-100%)'
          }}
          onMouseEnter={() => setHoveredDiscoverInfo(true)}
          onMouseLeave={() => setHoveredDiscoverInfo(false)}
        >
          <p className="font-semibold mb-2">Everything in Discover includes:</p>
          <div className="space-y-1.5">
            {discoverFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className={`w-3 h-3 flex-shrink-0 mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                <span className="leading-tight">{feature.name}</span>
              </div>
            ))}
          </div>
          <div className={`absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
            isDark ? 'border-t-slate-800' : 'border-t-white'
          }`}></div>
        </div>
      )}
    </div>
  );
}
