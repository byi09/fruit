import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../hooks/useChat';

interface ChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  myPlayerId: string;
}

export function Chat({ messages, onSend, myPlayerId }: ChatProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-xl shadow-md flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="font-bold text-gray-700 text-sm">Chat</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-4">No messages yet</p>
        )}
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="text-xs text-gray-400 text-center italic py-0.5">
                {msg.message}
              </div>
            );
          }
          const isMe = msg.playerId === myPlayerId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-[10px] text-gray-400 ml-1 mb-0.5">{msg.playerName}</span>
              )}
              <div
                className={`px-2.5 py-1.5 rounded-xl text-sm max-w-[85%] break-words ${
                  isMe
                    ? 'bg-emerald-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-100">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={200}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
