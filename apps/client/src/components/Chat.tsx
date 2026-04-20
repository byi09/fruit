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
    <div className="panel flex flex-col h-full min-h-0">
      <div className="px-3 py-2.5 border-b border-border">
        <h3 className="label-eyebrow">Chat</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-text-3 text-center mt-8">No messages yet</p>
        )}
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="text-[11px] text-text-3 text-center italic py-0.5">
                {msg.message}
              </div>
            );
          }
          const isMe = msg.playerId === myPlayerId;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (
                <span className="text-[10px] text-text-3 ml-1 mb-0.5">{msg.playerName}</span>
              )}
              <div
                className={`px-2.5 py-1.5 rounded-xl text-sm max-w-[85%] break-words ${
                  isMe
                    ? 'bg-accent text-white rounded-br-[3px]'
                    : 'bg-white/[0.06] text-text border border-border rounded-bl-[3px]'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="p-2 border-t border-border">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            maxLength={200}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg
                       bg-panel border border-border text-text placeholder:text-text-3
                       focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/20
                       transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="px-3 py-1.5 bg-accent text-white text-sm rounded-lg font-medium
                       hover:bg-accent-dark disabled:opacity-30 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
