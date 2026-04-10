import { useState, useEffect } from 'react';

interface TimerProps {
  endsAt: number;
}

export function Timer({ endsAt }: TimerProps) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.max(0, endsAt - Date.now());
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [endsAt]);

  const seconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds <= 10;

  return (
    <div
      className={`text-center font-mono text-3xl font-extrabold tabular-nums transition-colors ${
        isLow ? 'text-red-500 animate-pulse' : 'text-gray-800'
      }`}
    >
      {minutes}:{secs.toString().padStart(2, '0')}
    </div>
  );
}
