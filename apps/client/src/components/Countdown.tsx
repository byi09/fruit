import { useState, useEffect, useRef } from 'react';
import { serverNow } from '../hooks/useServerTime';

interface CountdownProps {
  startsAt: number;
}

const RING_R = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--countdown-bg)' }}
    >
      {/* Orbs */}
      <div
        className="orb animate-orb1"
        style={{
          top: '10%',
          left: '15%',
          width: 420,
          height: 420,
          background: 'radial-gradient(circle, var(--orb-accent-weak), transparent 60%)',
        }}
      />
      <div
        className="orb animate-orb2"
        style={{
          bottom: '10%',
          right: '15%',
          width: 480,
          height: 480,
          background: 'radial-gradient(circle, var(--orb-blue), transparent 60%)',
        }}
      />

      <div className="relative flex items-center justify-center animate-scale-in">
        <svg viewBox="0 0 100 100" className="w-60 h-60 -rotate-90">
          <circle
            cx="50" cy="50" r={RING_R}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth="4"
          />
          <circle
            cx="50" cy="50" r={RING_R}
            fill="none"
            stroke={isGo ? 'var(--countdown-ring-go)' : 'var(--countdown-ring-active)'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-colors duration-200"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            key={display}
            className={`font-display font-extrabold select-none animate-count-pulse ${
              isGo ? 'gradient-text-go' : ''
            }`}
            style={{
              fontSize: isGo ? 'clamp(60px, 12vw, 120px)' : 'clamp(120px, 20vw, 200px)',
              lineHeight: 1,
              color: isGo ? undefined : 'var(--countdown-display)',
            }}
          >
            {display}
          </span>
        </div>
      </div>

      {!isGo && (
        <p
          className="absolute bottom-[28%] text-text-3 uppercase"
          style={{ fontSize: 14, letterSpacing: '0.1em' }}
        >
          Get ready
        </p>
      )}
    </div>
  );
}
