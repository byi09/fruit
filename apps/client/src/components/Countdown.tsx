import { useState, useEffect, useRef } from 'react';
import { serverNow } from '../hooks/useServerTime';

interface CountdownProps {
  startsAt: number;
}

const RING_CIRCUMFERENCE = 2 * Math.PI * 45;

export function Countdown({ startsAt }: CountdownProps) {
  const [display, setDisplay] = useState<string>('3');
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const totalMsRef = useRef(startsAt - serverNow());

  useEffect(() => {
    const totalMs = startsAt - serverNow();
    totalMsRef.current = totalMs;
    const totalSeconds = Math.max(1, Math.ceil(totalMs / 1000));

    setDisplay(String(totalSeconds));

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i < totalSeconds; i++) {
      const delay = totalMs - (totalSeconds - i) * 1000;
      timers.push(
        setTimeout(() => {
          setDisplay(String(totalSeconds - i));
        }, Math.max(0, delay)),
      );
    }

    timers.push(
      setTimeout(() => {
        setDisplay('GO!');
      }, Math.max(0, totalMs)),
    );

    function tick() {
      const elapsed = totalMsRef.current - (startsAt - serverNow());
      const pct = Math.min(1, Math.max(0, elapsed / totalMsRef.current));
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [startsAt]);

  const isGo = display === 'GO!';
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center game-bg">
      <div className="relative flex items-center justify-center animate-scale-in">
        <svg
          viewBox="0 0 100 100"
          className="w-48 h-48 sm:w-56 sm:h-56 -rotate-90"
        >
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke={isGo ? '#4ade80' : '#e94560'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-colors duration-200"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            key={display}
            className={`font-black animate-scale-in select-none ${
              isGo
                ? 'text-5xl sm:text-6xl text-emerald-400'
                : 'text-7xl sm:text-8xl text-white'
            }`}
          >
            {display}
          </span>
        </div>
      </div>

      {!isGo && (
        <p className="absolute bottom-1/3 text-white/30 text-sm font-medium tracking-wide">
          Get ready
        </p>
      )}
    </div>
  );
}
