'use client';

import { useState } from 'react';
import { Check, Sparkles, ArrowRight, Info } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */
import { useTheme } from '../ThemeContext';

export default function UpgradePage() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const plans = [
    {
      name: 'Discover',
      tagline: 'Get Seen with AI-Ready Marketing, Done for You.',
      price: 39,
      iconSrc: '/discover-icon.png',
      current: true,
      popular: false,
      color: 'sky',
      features: [
        { name: 'AI-Optimized Profile Page', tooltip: 'Professional profile optimized for AI search visibility' },
        { name: '1 SEO Blog per Month', tooltip: 'Monthly blog post optimized for search engines' },
        { name: '1 YouTube Video per Month', tooltip: 'Professional video content for your channel' },
        { name: 'Review Blasts', tooltip: 'Automated review request campaigns' },
        { name: 'Backlinks from EyesAI Network', tooltip: 'Quality backlinks from our network of sites' },
        { name: 'Social Sharing (Facebook & X)', tooltip: 'Content shared on Facebook and X (Twitter)' },
        { name: 'Monthly Report', tooltip: 'Detailed monthly performance report' },
        { name: 'Hands-Off Promise', tooltip: 'We handle everything - no logins needed' },
      ]
    },
    {
      name: 'Verified',
      tagline: 'Get Seen Everywhere with More Reach and Proof.',
      price: 69,
      iconSrc: '/verified-icon.png',
      current: false,
      popular: true,
      color: 'violet',
      includesDiscover: true,
      features: [
        { name: 'Verified Badge', tooltip: 'Trust badge displayed on your profile' },
        { name: 'Priority Spotlight Rotation', tooltip: 'Featured placement in our spotlight sections' },
        { name: 'Bonus Citation (1 per Month)', tooltip: 'Additional directory listing each month' },
        { name: '3 New FAQs per Month', tooltip: 'Monthly FAQ expansion for better SEO coverage' },
        { name: 'Expanded Social Sharing', tooltip: 'TikTok & Instagram on top of Facebook & X' },
        { name: 'Expanded Monthly Report', tooltip: 'More detailed analytics and insights' },
        { name: 'Hashtag & Keyword Suggestions', tooltip: 'AI-powered content optimization tips' },
        { name: '3 Custom Marketing Recommendations', tooltip: 'Personalized growth strategies each month' },
      ]
    }
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="text-center mb-12">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>
          <Sparkles className="w-4 h-4" />
          Choose Your Plan
        </div>
        <h1 className={`text-3xl lg:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Simple, Transparent Pricing
        </h1>
        <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
          EyesAI posts everything from our network — no logins needed
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
        {plans.map((plan) => {
          return (
            <div
              key={plan.name}
              className={`relative backdrop-blur-sm rounded-2xl border transition-all ${
                plan.popular
                  ? 'border-violet-400/50 shadow-xl shadow-violet-500/10'
                  : isDark
                  ? 'border-white/10 hover:border-sky-400/30'
                  : 'border-slate-200/60 hover:border-sky-300'
              } ${isDark ? 'bg-white/5' : 'bg-white/80'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-gradient-to-b from-violet-400 to-violet-600 text-white text-xs font-medium rounded-full shadow-lg shadow-violet-500/30">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <img
                    src={plan.iconSrc}
                    alt={`${plan.name} icon`}
                    className="w-20 h-20 object-contain"
                  />
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ${plan.price}
                    </span>
                    <span className={isDark ? 'text-white/50' : 'text-slate-500'}>/month</span>
                  </div>
                  <p className={`text-sm mt-2 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                    {plan.tagline}
                  </p>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 mb-6 ${
                    plan.current
                      ? isDark
                        ? 'bg-white/5 text-white/50 cursor-not-allowed border border-white/10'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : plan.color === 'violet'
                      ? 'bg-gradient-to-b from-violet-400 via-violet-500 to-violet-600 text-white hover:shadow-lg hover:shadow-violet-500/30 border-t border-white/20'
                      : 'bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white hover:shadow-lg hover:shadow-sky-500/30 border-t border-white/20'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? (
                    'Current Plan'
                  ) : (
                    <>
                      <span>Upgrade</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Features */}
                <div className={`border-t pt-6 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <p className={`text-sm font-medium mb-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    What's Included:{plan.includesDiscover && <span className={isDark ? 'text-white/40' : 'text-slate-400'}> Everything in Discover, plus:</span>}
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 relative"
                        onMouseEnter={() => setHoveredFeature(`${plan.name}-${index}`)}
                        onMouseLeave={() => setHoveredFeature(null)}
                      >
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.color === 'violet' ? 'text-violet-500' : 'text-sky-500'
                        }`} />
                        <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                          {feature.name}
                        </span>
                        <Info className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 cursor-help ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
                        {hoveredFeature === `${plan.name}-${index}` && (
                          <div className={`absolute left-0 top-6 z-10 px-3 py-2 rounded-lg text-xs max-w-[200px] ${
                            isDark ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'
                          }`}>
                            {feature.tooltip}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <p className={isDark ? 'text-white/50' : 'text-slate-500'}>
          Have questions about which plan is right for you?{' '}
          <a href="/client/support" className="text-sky-500 hover:text-sky-400 font-medium">
            Contact our team
          </a>
        </p>
      </div>
    </div>
  );
}
