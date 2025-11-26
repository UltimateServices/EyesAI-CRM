'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WaitingChat {
  id: string;
  visitor_name?: string;
  created_at: string;
}

interface ChatNotificationContextType {
  waitingCount: number;
  waitingChats: WaitingChat[];
  clearNotifications: () => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType>({
  waitingCount: 0,
  waitingChats: [],
  clearNotifications: () => {},
});

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const [waitingChats, setWaitingChats] = useState<WaitingChat[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const notificationShown = new Set<string>();

  const supabase = createClient();

  // Wait for mount (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Don't initialize on server or before mount
    if (!mounted) return;

    let channel: any;
    let timeoutId: NodeJS.Timeout;

    const initialize = async () => {
      try {
        // Delay initialization to ensure layout auth completes first
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user is authenticated
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth session error:', error);
          return;
        }

        if (!session || !session.user) {
          console.log('No authenticated session, skipping chat notifications');
          return;
        }

        console.log('Initializing chat notifications for user:', session.user.email);

        // Fetch initial waiting conversations
        await fetchWaitingChats();

        // Set up real-time subscription
        channel = supabase
          .channel('global_chat_notifications')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chat_conversations',
              filter: 'status=eq.waiting_human',
            },
            (payload) => {
              console.log('Chat notification:', payload);

              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const conv = payload.new as WaitingChat;

                // Show browser notification and play sound
                if (!notificationShown.has(conv.id)) {
                  notificationShown.add(conv.id);
                  showNotification(conv);
                  playNotificationSound();
                }

                // Refresh waiting chats
                fetchWaitingChats();
              } else if (payload.eventType === 'DELETE') {
                fetchWaitingChats();
              }
            }
          )
          .subscribe();

        // Request notification permission
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch (error) {
        console.error('Error initializing chat notifications:', error);
      }
    };

    initialize();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [mounted]);

  useEffect(() => {
    setWaitingCount(waitingChats.length);
  }, [waitingChats]);

  const fetchWaitingChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, visitor_name, created_at')
        .eq('status', 'waiting_human')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setWaitingChats(data || []);
    } catch (error) {
      console.error('Error fetching waiting chats:', error);
    }
  };

  const showNotification = (conv: WaitingChat) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('🔔 New Chat Request', {
        body: `${conv.visitor_name || 'A visitor'} needs help immediately!`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: conv.id,
        requireInteraction: true, // Stays on screen until clicked
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/support';
        notification.close();
      };
    }
  };

  const playNotificationSound = () => {
    // Create urgent notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Play two beeps for urgency
    [0, 0.3].forEach((delay) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 880; // Higher pitch for urgency
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.3);

      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + 0.3);
    });
  };

  const clearNotifications = () => {
    setWaitingCount(0);
  };

  return (
    <ChatNotificationContext.Provider value={{ waitingCount, waitingChats, clearNotifications }}>
      {children}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotifications() {
  return useContext(ChatNotificationContext);
}
