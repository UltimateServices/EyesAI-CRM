'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, User, Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  senderType: 'visitor' | 'ai' | 'va';
  senderName?: string;
  messageText: string;
  createdAt?: string;
}

interface ChatWidgetProps {
  source?: 'webflow' | 'client_portal';
  companyId?: string;
  visitorName?: string;
  visitorEmail?: string;
}

export default function ChatWidget({
  source = 'client_portal',
  companyId,
  visitorName: initialName,
  visitorEmail: initialEmail,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingForHuman, setWaitingForHuman] = useState(false);
  const [humanConnected, setHumanConnected] = useState(false);

  // Contact info for new conversations
  const [visitorName, setVisitorName] = useState(initialName || '');
  const [visitorEmail, setVisitorEmail] = useState(initialEmail || '');
  const [showContactForm, setShowContactForm] = useState(false);

  // Auto-timeout tracking
  const [lastVisitorMessageTime, setLastVisitorMessageTime] = useState<number | null>(null);
  const [sentFirstWarning, setSentFirstWarning] = useState(false);
  const [chatResolved, setChatResolved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-timeout checker - runs every 10 seconds
  useEffect(() => {
    if (!conversationId || !lastVisitorMessageTime || chatResolved || humanConnected) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const inactiveSeconds = Math.floor((now - lastVisitorMessageTime) / 1000);

      // First warning at 60 seconds
      if (inactiveSeconds >= 60 && !sentFirstWarning) {
        sendAutomatedMessage('Are you still there?');
        setSentFirstWarning(true);
      }

      // Auto-resolve at 120 seconds
      if (inactiveSeconds >= 120 && sentFirstWarning) {
        sendAutomatedMessage(
          "Sorry it looks like you stepped away, please open a new chat when you're ready"
        );
        autoResolveConversation();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [conversationId, lastVisitorMessageTime, sentFirstWarning, chatResolved, humanConnected]);

  const sendAutomatedMessage = async (messageText: string) => {
    if (!conversationId) return;

    try {
      // Save automated message to database
      const msgResponse = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderType: 'ai',
          senderName: 'System',
          messageText,
        }),
      });

      const msgData = await msgResponse.json();

      // Add message to UI
      setMessages((prev) => [
        ...prev,
        {
          id: msgData.message.id,
          senderType: 'ai',
          senderName: 'System',
          messageText,
          createdAt: msgData.message.created_at,
        },
      ]);
    } catch (error) {
      console.error('Error sending automated message:', error);
    }
  };

  const autoResolveConversation = async () => {
    if (!conversationId) return;

    try {
      // Update conversation status to resolved
      await fetch('/api/chat/conversation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          status: 'resolved',
        }),
      });

      // Mark chat as resolved
      setChatResolved(true);

      // Close chat widget after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        // Reset states for next chat
        setConversationId(null);
        setMessages([]);
        setLastVisitorMessageTime(null);
        setSentFirstWarning(false);
        setChatResolved(false);
        setWaitingForHuman(false);
        setHumanConnected(false);
      }, 3000);
    } catch (error) {
      console.error('Error auto-resolving conversation:', error);
    }
  };

  const startConversation = async (initialMessage: string) => {
    if (!initialMessage.trim()) return;

    setLoading(true);
    try {
      // Create conversation
      const convResponse = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: visitorName || 'Anonymous',
          visitorEmail: visitorEmail || '',
          companyId,
          source,
          pageUrl: window.location.href,
          initialMessage,
        }),
      });

      const convData = await convResponse.json();

      if (convData.conversation) {
        setConversationId(convData.conversation.id);

        // Set initial timestamp for timeout tracking
        setLastVisitorMessageTime(Date.now());

        // Add visitor message to UI
        setMessages([
          {
            id: convData.visitorMessage.id,
            senderType: 'visitor',
            senderName: visitorName || 'You',
            messageText: initialMessage,
            createdAt: convData.visitorMessage.created_at,
          },
        ]);

        // Get AI response
        await getAIResponse(convData.conversation.id, initialMessage, []);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setLoading(false);
      setInputMessage('');
    }
  };

  const getAIResponse = async (
    convId: string,
    visitorMsg: string,
    history: ChatMessage[]
  ) => {
    try {
      const aiResponse = await fetch('/api/chat/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          visitorMessage: visitorMsg,
          conversationHistory: history,
        }),
      });

      const aiData = await aiResponse.json();

      if (aiData.aiMessage) {
        // Save AI message to database
        const msgResponse = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            senderType: 'ai',
            senderName: 'AI Assistant',
            messageText: aiData.aiMessage,
          }),
        });

        const msgData = await msgResponse.json();

        // Add AI message to UI
        setMessages((prev) => [
          ...prev,
          {
            id: msgData.message.id,
            senderType: 'ai',
            senderName: 'AI Assistant',
            messageText: aiData.aiMessage,
            createdAt: msgData.message.created_at,
          },
        ]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    // If no conversation yet, start one
    if (!conversationId) {
      if (!visitorName && !visitorEmail) {
        setShowContactForm(true);
        return;
      }
      await startConversation(inputMessage);
      return;
    }

    // Reset timeout timer and warning flag when visitor responds
    setLastVisitorMessageTime(Date.now());
    setSentFirstWarning(false);

    const tempMessage: ChatMessage = {
      id: Date.now().toString(),
      senderType: 'visitor',
      senderName: visitorName || 'You',
      messageText: inputMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');

    setLoading(true);
    try {
      // Save visitor message
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderType: 'visitor',
          senderName: visitorName || 'Anonymous',
          messageText: currentMessage,
        }),
      });

      // If waiting for human, don't get AI response
      if (!waitingForHuman && !humanConnected) {
        await getAIResponse(conversationId, currentMessage, messages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestHuman = async () => {
    if (!conversationId) return;

    setWaitingForHuman(true);

    try {
      // Update conversation status
      await fetch('/api/chat/conversation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          status: 'waiting_human',
        }),
      });

      // Add system message
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          senderType: 'ai',
          senderName: 'System',
          messageText: 'A support agent will be with you shortly. Please wait...',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error requesting human:', error);
    }
  };

  const submitContactInfo = () => {
    if (!visitorName.trim()) {
      alert('Please enter your name');
      return;
    }
    setShowContactForm(false);
    startConversation(inputMessage);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">EyesAI Support</h3>
                <p className="text-xs text-white/80">
                  {humanConnected ? 'Connected to agent' : 'AI-powered chat'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contact Form */}
          {showContactForm && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-center mb-6">
                <h4 className="font-semibold text-slate-900 mb-2">
                  Let's get started
                </h4>
                <p className="text-sm text-slate-600">
                  Please tell us a bit about yourself
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <Button
                  onClick={submitContactInfo}
                  className="w-full gap-2"
                >
                  Start Chat
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          {!showContactForm && (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      How can we help?
                    </h4>
                    <p className="text-sm text-slate-600">
                      Ask us anything about EyesAI
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.senderType === 'visitor' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.senderType === 'visitor'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}
                    >
                      {message.senderType !== 'visitor' && (
                        <div className="flex items-center gap-2 mb-1">
                          {message.senderType === 'ai' ? (
                            <Bot className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          <span className="text-xs font-medium">
                            {message.senderName}
                          </span>
                        </div>
                      )}
                      <p className="text-sm">{message.messageText}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Request Human Button */}
              {!waitingForHuman && !humanConnected && messages.length > 2 && (
                <div className="px-4 pb-2">
                  <button
                    onClick={requestHuman}
                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Not satisfied? Request human support →
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-slate-200">
                {chatResolved ? (
                  <div className="text-center py-2">
                    <p className="text-sm text-slate-500">
                      This chat has been closed due to inactivity
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim()}
                      className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
