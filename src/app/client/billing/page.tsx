'use client';

import { useState } from 'react';
import { CreditCard, Download, Receipt, Calendar, CheckCircle2, Plus, Trash2, Shield } from 'lucide-react';
/* eslint-disable @next/next/no-img-element */
import { useTheme } from '../ThemeContext';

export default function BillingPage() {
  const [showAddCard, setShowAddCard] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const currentPlan = { name: 'Discover', price: '$39', billingCycle: 'monthly', nextBilling: 'Dec 15, 2024', status: 'active' };
  const paymentMethods = [
    { id: 1, type: 'visa', last4: '7823', expiry: '08/26', isDefault: true },
  ];
  const invoices = [
    { id: 'INV-2847', date: 'Nov 15, 2024', amount: '$39.00', status: 'paid' },
    { id: 'INV-2631', date: 'Oct 15, 2024', amount: '$39.00', status: 'paid' },
    { id: 'INV-2445', date: 'Sep 15, 2024', amount: '$39.00', status: 'paid' },
    { id: 'INV-2219', date: 'Aug 15, 2024', amount: '$39.00', status: 'paid' },
    { id: 'INV-2001', date: 'Jul 15, 2024', amount: '$39.00', status: 'paid' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className={`text-2xl lg:text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Billing</h1>
        <p className={`mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Manage your subscription and payment methods</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className={`backdrop-blur-sm rounded-2xl border p-6 mb-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Current Plan</h2>
                <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Your active subscription</p>
              </div>
              <span className={`px-3 py-1.5 text-sm font-medium rounded-full flex items-center gap-1.5 ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                <CheckCircle2 className="w-4 h-4" />
                Active
              </span>
            </div>

            <div className={`rounded-2xl p-6 border mb-6 ${isDark ? 'bg-sky-500/10 border-sky-400/20' : 'bg-sky-50 border-sky-200'}`}>
              <div className="flex items-end justify-between mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/discover-icon.png"
                    alt="Discover icon"
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <p className={`text-sm font-medium mb-1 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>DISCOVER PLAN</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentPlan.price}</span>
                      <span className={isDark ? 'text-white/50' : 'text-slate-500'}>/{currentPlan.billingCycle}</span>
                    </div>
                  </div>
                </div>
                <button className={`px-4 py-2 text-sm font-medium rounded-xl transition-all border ${isDark ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}>
                  Change Plan
                </button>
              </div>
              <div className={`flex items-center gap-2 text-sm mb-6 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                <Calendar className="w-4 h-4" />
                <span>Next billing date: {currentPlan.nextBilling}</span>
              </div>

              {/* Discover Features */}
              <div className={`pt-4 border-t ${isDark ? 'border-sky-400/20' : 'border-sky-200'}`}>
                <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>What&apos;s Included Monthly:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'AI Optimized Business Profile',
                    '1 SEO Rich Fresh Blog',
                    '1 YouTube Video',
                    'Review Repurposing',
                    'Backlinks from EyesAI Network',
                    '1 Social Share to Facebook',
                    '1 Social Share to X',
                    'Monthly Reporting',
                    'Hands-Off Promise',
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                      <span className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className={`px-4 py-2 text-sm font-medium rounded-xl transition-all border ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}>
                Update Billing Info
              </button>
              <button className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isDark ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}>
                Cancel Subscription
              </button>
            </div>
          </div>

          <div className={`backdrop-blur-sm rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
            <div className={`p-6 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Billing History</h2>
            </div>
            <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {invoices.map((invoice) => (
                <div key={invoice.id} className={`flex items-center justify-between p-4 transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <Receipt className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{invoice.id}</p>
                      <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{invoice.amount}</span>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>{invoice.status}</span>
                    <button className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                      <Download className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className={`backdrop-blur-sm rounded-2xl border p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Payment Methods</h2>
              <button onClick={() => setShowAddCard(true)} className={`p-2 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
                <Plus className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <div key={method.id} className={`p-4 rounded-xl border transition-all ${method.isDefault ? isDark ? 'bg-sky-500/10 border-sky-400/30' : 'bg-sky-50 border-sky-200' : isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-8 rounded-md flex items-center justify-center ${method.type === 'visa' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                        <span className="text-white text-xs font-bold uppercase">{method.type}</span>
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>•••• {method.last4}</p>
                        <p className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Expires {method.expiry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.isDefault && <span className={`px-2 py-0.5 text-xs font-medium rounded ${isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>Default</span>}
                      <button className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'}`}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`rounded-xl p-4 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Secure Payments</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Your payment information is encrypted and securely processed by Stripe.</p>
                </div>
              </div>
            </div>
          </div>

          {showAddCard && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className={`rounded-2xl border p-6 w-full max-w-md ${isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Add Payment Method</h3>
                <form className="space-y-4">
                  <div>
                    <label className={`block text-sm mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Card Number</label>
                    <input type="text" placeholder="4242 4242 4242 4242" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Expiry</label>
                      <input type="text" placeholder="MM/YY" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>CVC</label>
                      <input type="text" placeholder="123" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <button type="button" onClick={() => setShowAddCard(false)} className={`flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-all border ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}>Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all border-t border-white/20">Add Card</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
