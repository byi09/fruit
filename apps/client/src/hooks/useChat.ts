import { useState, useCallback, useEffect, useRef } from 'react';
import { socket } from '../socket';

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

let msgCounter = 0;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    function onChatMessage(data: { playerId: string; playerName: string; message: string; timestamp: number }) {
      setMessages((prev) => [
        ...prev.slice(-99), // keep last 100
        { id: `msg-${++msgCounter}`, ...data },
      ]);
      if (!isVisibleRef.current) {
        setUnreadCount((c) => c + 1);
      }
    }

    function onChatSystem(data: { message: string; timestamp: number }) {
      setMessages((prev) => [
        ...prev.slice(-99),
        { id: `sys-${++msgCounter}`, playerName: '', message: data.message, timestamp: data.timestamp, isSystem: true },
      ]);
    }

    socket.on('chat:message', onChatMessage);
    socket.on('chat:system', onChatSystem);

    return () => {
      socket.off('chat:message', onChatMessage);
      socket.off('chat:system', onChatSystem);
    };
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!message.trim()) return;
    socket.emit('chat:send', { message: message.trim() });
  }, []);

  const markVisible = useCallback((visible: boolean) => {
    isVisibleRef.current = visible;
    if (visible) setUnreadCount(0);
  }, []);

  return { messages, sendMessage, unreadCount, markVisible };
}
