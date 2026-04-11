import { useState, useEffect } from 'react';
import { serverNow } from '../hooks/useServerTime';

const RING_R = 20;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

interface TimerProps {
  endsAt: number;
  isPaused?: boolean;
  durationMs?: number;
}

export function Timer({ endsAt, isPaused, durationMs = 120_000 }: TimerProps) {
  const [remaining, setRemaining] = useState(Math.max(0, endsAt - serverNow()));

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      const r = Math.max(0, endsAt - serverNow());
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [endsAt, isPaused]);

  const seconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isLow = seconds <= 10;
  const fraction = Math.min(1, remaining / durationMs);
  const dashOffset = RING_CIRCUMFERENCE * (1 - fraction);

  const ringColor = isLow ? '#ef4444' : '#e94560';

  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 48 48" className="w-10 h-10 -rotate-90 shrink-0">
        <circle
          cx="24" cy="24" r={RING_R}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="3"
        />
        <circle
          cx="24" cy="24" r={RING_R}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="transition-[stroke] duration-300"
        />
      </svg>
      <span
        className={`font-mono text-xl font-bold tabular-nums ${
          isLow ? 'text-red-500' : 'text-stone-800'
        } ${isLow && !isPaused ? 'animate-pulse' : ''}`}
      >
        {minutes}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
