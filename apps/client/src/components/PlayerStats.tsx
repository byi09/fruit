import { useEffect, useRef, useState } from 'react';

interface PlayerStatsProps {
  score: number;
  moves: number;
  totalCells: number;
  startsAt: number;
}

export function PlayerStats({ score, moves, totalCells, startsAt }: PlayerStatsProps) {
  const clearPct = totalCells > 0 ? Math.round((score / totalCells) * 100) : 0;

  const [elapsed, setElapsed] = useState(() => Math.max(0, (performance.now() - (startsAt - Date.now() + performance.now())) / 1000));
  const [peakRate, setPeakRate] = useState(0);
  const offsetRef = useRef(startsAt - Date.now() + performance.now());
  const historyRef = useRef<{ time: number; score: number }[]>([]);

  useEffect(() => {
    offsetRef.current = startsAt - Date.now() + performance.now();
    historyRef.current = [];
    setPeakRate(0);
  }, [startsAt]);

  // Track score snapshots for 5s window peak calculation
  const scoreRef = useRef(score);
  scoreRef.current = score;

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const now = performance.now();
      const el = Math.max(0, (now - offsetRef.current) / 1000);
      setElapsed(el);

      // Record current score with timestamp
      const history = historyRef.current;
      history.push({ time: now, score: scoreRef.current });

      // Prune entries older than 5s
      const cutoff = now - 5000;
      while (history.length > 0 && history[0].time < cutoff) {
        history.shift();
      }

      // Calculate rate over the window
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

  const efficiency = elapsed > 0 ? (score / elapsed).toFixed(3) : '0.000';
  const peakDisplay = peakRate.toFixed(3);

  return (
    <div className="bg-white/90 backdrop-blur rounded-xl shadow-md p-3 sm:p-4">
      <h3 className="font-bold text-gray-700 text-sm mb-3">Your Stats</h3>

      {/* Score ring */}
      <div className="flex items-center justify-center mb-3">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="#10b981" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${clearPct * 2.64} 264`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">{score}</span>
            <span className="text-[10px] text-gray-400 uppercase">cleared</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-gray-700 tabular-nums">{moves}</div>
          <div className="text-[10px] text-gray-400 uppercase">Moves</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-lg font-bold text-gray-700 tabular-nums">{clearPct}%</div>
          <div className="text-[10px] text-gray-400 uppercase">Board</div>
        </div>
        <div className="col-span-2 bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-amber-600 tabular-nums font-mono tracking-tight">{efficiency}</div>
          <div className="text-[10px] text-gray-400 uppercase">Apples / Second</div>
        </div>
        <div className="col-span-2 bg-gray-50 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-rose-500 tabular-nums font-mono tracking-tight">{peakDisplay}</div>
          <div className="text-[10px] text-gray-400 uppercase">Peak (5s window)</div>
        </div>
      </div>
    </div>
  );
}
