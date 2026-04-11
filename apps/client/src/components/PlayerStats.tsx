import { useEffect, useRef, useState } from 'react';
import { serverNow } from '../hooks/useServerTime';

interface PlayerStatsProps {
  score: number;
  moves: number;
  totalCells: number;
  startsAt: number;
}

const RING_R = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

export function PlayerStats({ score, moves, totalCells, startsAt }: PlayerStatsProps) {
  const clearPct = totalCells > 0 ? Math.round((score / totalCells) * 100) : 0;

  const [elapsed, setElapsed] = useState(() => Math.max(0, (performance.now() - (startsAt - serverNow() + performance.now())) / 1000));
  const [peakRate, setPeakRate] = useState(0);
  const offsetRef = useRef(startsAt - serverNow() + performance.now());
  const historyRef = useRef<{ time: number; score: number }[]>([]);

  useEffect(() => {
    offsetRef.current = startsAt - serverNow() + performance.now();
    historyRef.current = [];
    setPeakRate(0);
  }, [startsAt]);

  const scoreRef = useRef(score);
  scoreRef.current = score;

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const now = performance.now();
      const el = Math.max(0, (now - offsetRef.current) / 1000);
      setElapsed(el);

      const history = historyRef.current;
      history.push({ time: now, score: scoreRef.current });

      const cutoff = now - 5000;
      while (history.length > 0 && history[0].time < cutoff) {
        history.shift();
      }

      if (history.length >= 2) {
        const oldest = history[0];
        const newest = history[history.length - 1];
        const dt = (newest.time - oldest.time) / 1000;
        if (dt >= 0.5) {
          const rate = (newest.score - oldest.score) / dt;
          setPeakRate(prev => Math.max(prev, rate));
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const efficiency = elapsed > 0 ? (score / elapsed).toFixed(2) : '0.00';
  const peakDisplay = peakRate.toFixed(2);
  const ringDash = (clearPct / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="panel p-3">
      <h3 className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-3">Stats</h3>

      {/* Score ring */}
      <div className="flex items-center justify-center mb-3">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r={RING_R} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="5" />
            <circle
              cx="40" cy="40" r={RING_R} fill="none"
              stroke="#e94560" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${ringDash} ${RING_CIRCUMFERENCE}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-extrabold text-stone-800 tabular-nums">{score}</span>
            <span className="text-[9px] text-stone-400 uppercase">cleared</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-stone-50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-stone-700 tabular-nums">{moves}</div>
          <div className="text-[9px] text-stone-400 uppercase">Moves</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-stone-700 tabular-nums">{clearPct}%</div>
          <div className="text-[9px] text-stone-400 uppercase">Board</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-accent tabular-nums font-mono">{efficiency}</div>
          <div className="text-[9px] text-stone-400 uppercase">/sec</div>
        </div>
        <div className="bg-stone-50 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-amber-600 tabular-nums font-mono">{peakDisplay}</div>
          <div className="text-[9px] text-stone-400 uppercase">Peak</div>
        </div>
      </div>
    </div>
  );
}
