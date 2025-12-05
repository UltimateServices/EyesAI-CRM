'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Search, Clock, CheckCircle2, ChevronRight, Send, Paperclip, X } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useCompany } from '../CompanyContext';
import ChatWidget from '@/components/chat/ChatWidget';

export default function SupportPage() {
  const { company } = useCompany();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tickets = [
    {
      id: 1, subject: 'Adding new service areas for AI visibility', status: 'open', priority: 'normal', lastUpdate: '2 hours ago',
      messages: [
        { sender: 'You', content: 'Hi, we just expanded our dumpster rental service to Katy and Sugar Land. How do we update our AI profile to include these areas?', time: '10:30 AM' },
        { sender: 'Support', content: 'Great news on the expansion! I\'ve added Katy and Sugar Land to your service areas. Our AI engine will now optimize your visibility for dumpster rental queries in those regions. You should see improvements within 48 hours.', time: '11:15 AM' },
      ]
    },
    { id: 2, subject: 'Competitor showing above us for "roll-off rental"', status: 'resolved', priority: 'high', lastUpdate: '1 day ago', messages: [] },
    { id: 3, subject: 'Request for commercial services keyword targeting', status: 'pending', priority: 'normal', lastUpdate: '3 days ago', messages: [] },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      open: isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700',
      resolved: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
      pending: isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700',
    };
    const icons = { open: MessageSquare, resolved: CheckCircle2, pending: Clock };
    const Icon = icons[status as keyof typeof icons];
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className={isDark ? 'text-white/60' : 'text-slate-600'}>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <ChatWidget
        source="client_portal"
        companyId={company.id}
        visitorName={company.name}
        visitorEmail={company.email}
      />
      <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Support</h1>
          <p className={`mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Get help and submit support tickets</p>
        </div>
        <button onClick={() => setShowNewTicket(true)} className="px-4 py-2.5 bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all flex items-center gap-2 border-t border-white/20">
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{ label: 'Open', count: 1, icon: MessageSquare, color: 'sky' }, { label: 'Pending', count: 1, icon: Clock, color: 'amber' }, { label: 'Resolved', count: 1, icon: CheckCircle2, color: 'emerald' }].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`backdrop-blur-sm rounded-2xl p-5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stat.color === 'sky' ? isDark ? 'bg-sky-500/20' : 'bg-sky-100' : stat.color === 'amber' ? isDark ? 'bg-amber-500/20' : 'bg-amber-100' : isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                  <Icon className={`w-4 h-4 ${stat.color === 'sky' ? isDark ? 'text-sky-400' : 'text-sky-600' : stat.color === 'amber' ? isDark ? 'text-amber-400' : 'text-amber-600' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <span className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.count}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className={`backdrop-blur-sm rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
            <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                <input type="text" placeholder="Search tickets..." className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
              </div>
            </div>
            <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {tickets.map((ticket) => (
                <button key={ticket.id} onClick={() => setSelectedTicket(ticket.id)} className={`w-full p-4 text-left transition-all ${selectedTicket === ticket.id ? isDark ? 'bg-white/5' : 'bg-slate-50' : ''} ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.subject}</p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{ticket.lastUpdate}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(ticket.status)}
                      <ChevronRight className={`w-4 h-4 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {showNewTicket ? (
            <div className={`backdrop-blur-sm rounded-2xl border p-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Ticket</h2>
                <button onClick={() => setShowNewTicket(false)} className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                  <X className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
                </button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Subject</label>
                  <input type="text" placeholder="Brief description of your issue" className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                </div>
                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Category</label>
                  <select className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    <option value="">Select a category</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm mb-2 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>Message</label>
                  <textarea rows={5} placeholder="Describe your issue in detail..." className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button type="button" className={`px-4 py-2 flex items-center gap-2 transition-all ${isDark ? 'text-white/60 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
                    <Paperclip className="w-4 h-4" />
                    Attach File
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0369A1] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all flex items-center gap-2 border-t border-white/20">
                    <Send className="w-4 h-4" />
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          ) : selectedTicket ? (
            <div className={`backdrop-blur-sm rounded-2xl border overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
              {(() => {
                const ticket = tickets.find(t => t.id === selectedTicket);
                if (!ticket) return null;
                return (
                  <>
                    <div className={`p-6 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{ticket.subject}</h2>
                          <p className={`text-sm mt-1 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Ticket #{ticket.id} • {ticket.lastUpdate}</p>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                    </div>
                    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                      {ticket.messages.map((message, index) => (
                        <div key={index} className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === 'You' ? 'bg-gradient-to-b from-[#38BDF8] to-[#0369A1] text-white' : isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'}`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.sender === 'You' ? 'text-white/70' : isDark ? 'text-white/40' : 'text-slate-500'}`}>{message.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {ticket.status !== 'resolved' && (
                      <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                          <input type="text" placeholder="Type your reply..." className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`} />
                          <button className="p-3 bg-gradient-to-b from-[#38BDF8] to-[#0369A1] rounded-xl hover:shadow-lg hover:shadow-sky-500/30 transition-all">
                            <Send className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          ) : (
            <div className={`backdrop-blur-sm rounded-2xl border p-12 text-center ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200/60'}`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <MessageSquare className={`w-8 h-8 ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Select a ticket</h3>
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Choose a ticket from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
