'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Search, Clock, CheckCircle2, ChevronRight, Send, User, Bot, AlertCircle, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

interface ChatConversation {
  id: string;
  visitor_name?: string;
  visitor_email?: string;
  status: 'ai_only' | 'waiting_human' | 'active_human' | 'resolved';
  source: string;
  last_message_at?: string;
  created_at?: string;
  last_message_preview?: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_type: 'visitor' | 'ai' | 'va';
  sender_name?: string;
  message_text: string;
  created_at?: string;
}

export default function WorkerSupportPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationShown = useRef<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
    setupRealtimeSubscription();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Poll for new conversations every 5 seconds (more responsive than bell icon)
    const pollInterval = setInterval(() => {
      fetchConversations();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      supabase.channel('chat_updates').unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv]);

  useEffect(() => {
    const waiting = conversations.filter(c => c.status === 'waiting_human').length;
    setWaitingCount(waiting);
  }, [conversations]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
        },
        (payload) => {
          console.log('Conversation change:', payload);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newConv = payload.new as ChatConversation;

            setConversations((prev) => {
              const exists = prev.find(c => c.id === newConv.id);
              if (exists) {
                return prev.map(c => c.id === newConv.id ? newConv : c);
              }
              return [newConv, ...prev];
            });

            // Show notification for waiting_human status
            if (newConv.status === 'waiting_human' && !notificationShown.current.has(newConv.id)) {
              notificationShown.current.add(newConv.id);
              showNotification(newConv);
              playNotificationSound();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('New message:', payload);
          const newMsg = payload.new as ChatMessage;

          // If message is for selected conversation, add it to messages
          if (selectedConv && newMsg.conversation_id === selectedConv.id) {
            setMessages((prev) => [...prev, newMsg]);
          }

          // Update last_message_at for the conversation
          fetchConversations();
        }
      )
      .subscribe();
  };

  const showNotification = (conv: ChatConversation) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('New Chat Request', {
        body: `${conv.visitor_name || 'A visitor'} is requesting human support`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: conv.id,
      });

      notification.onclick = () => {
        window.focus();
        setSelectedConv(conv);
        notification.close();
      };
    }
  };

  const playNotificationSound = () => {
    // Create notification sound (simple beep using Web Audio API)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const fetchConversations = async () => {
    try {
      const { data: convData, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch last message for each conversation
      const conversationsWithPreviews = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('message_text')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...conv,
            last_message_preview: messages?.[0]?.message_text || 'No messages yet',
          };
        })
      );

      setConversations(conversationsWithPreviews);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;

    setSending(true);
    try {
      // Send message to API
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          senderType: 'va',
          senderName: 'Support Team',
          messageText: newMessage,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Update conversation status to active_human if it was waiting
      if (selectedConv.status === 'waiting_human') {
        await fetch('/api/chat/conversation', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: selectedConv.id,
            status: 'active_human',
          }),
        });
      }

      setNewMessage('');
      fetchMessages(selectedConv.id);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const markAsResolved = async () => {
    if (!selectedConv) return;

    try {
      const response = await fetch('/api/chat/conversation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          status: 'resolved',
        }),
      });

      if (!response.ok) throw new Error('Failed to mark as resolved');

      fetchConversations();
      setSelectedConv({ ...selectedConv, status: 'resolved' });
    } catch (error) {
      console.error('Error marking as resolved:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ai_only: 'bg-blue-100 text-blue-700',
      waiting_human: 'bg-yellow-100 text-yellow-700 animate-pulse',
      active_human: 'bg-green-100 text-green-700',
      resolved: 'bg-slate-100 text-slate-700',
    };
    const labels = {
      ai_only: 'AI Only',
      waiting_human: 'Needs Human',
      active_human: 'Active',
      resolved: 'Resolved',
    };
    return (
      <Badge className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderIcon = (senderType: string) => {
    if (senderType === 'ai') return <Bot className="w-4 h-4" />;
    if (senderType === 'va') return <MessageSquare className="w-4 h-4" />;
    return <User className="w-4 h-4" />;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">Support Chats</h1>
            {waitingCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full animate-pulse">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">{waitingCount} waiting</span>
              </div>
            )}
          </div>
          <p className="text-slate-600 mt-1">Respond to visitor inquiries and chat requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${waitingCount > 0 ? 'bg-yellow-100 animate-pulse' : 'bg-yellow-50'}`}>
              <AlertCircle className={`w-5 h-5 ${waitingCount > 0 ? 'text-yellow-600' : 'text-yellow-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {conversations.filter(c => c.status === 'waiting_human').length}
              </p>
              <p className="text-sm text-slate-600">Waiting</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {conversations.filter(c => c.status === 'active_human').length}
              </p>
              <p className="text-sm text-slate-600">Active</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {conversations.filter(c => c.status === 'ai_only').length}
              </p>
              <p className="text-sm text-slate-600">AI Only</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <CheckCircle2 className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {conversations.filter(c => c.status === 'resolved').length}
              </p>
              <p className="text-sm text-slate-600">Resolved</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No conversations yet</div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full p-4 text-left transition-all hover:bg-slate-50 ${
                      selectedConv?.id === conv.id ? 'bg-slate-50' : ''
                    } ${conv.status === 'waiting_human' ? 'border-l-4 border-yellow-500' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {conv.visitor_name || 'Anonymous'}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {conv.last_message_preview || 'No messages yet'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {conv.source} • {formatTime(conv.last_message_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(conv.status)}
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2">
          {selectedConv ? (
            <Card className="overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedConv.visitor_name || 'Anonymous'}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedConv.visitor_email || 'No email'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedConv.status)}
                    {selectedConv.status !== 'resolved' && (
                      <Button
                        onClick={markAsResolved}
                        variant="outline"
                        size="sm"
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_type === 'va' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender_type === 'va'
                          ? 'bg-blue-600 text-white'
                          : message.sender_type === 'ai'
                          ? 'bg-slate-100 text-slate-900'
                          : 'bg-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getSenderIcon(message.sender_type)}
                        <span className="text-xs font-medium">
                          {message.sender_name}
                        </span>
                      </div>
                      <p className="text-sm">{message.message_text}</p>
                      <p
                        className={`text-xs mt-2 ${
                          message.sender_type === 'va'
                            ? 'text-white/70'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedConv.status !== 'resolved' && (
                <div className="p-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Type your reply..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      disabled={sending}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-12 text-center h-[600px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-slate-500">
                Choose a conversation from the list to view and respond
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
