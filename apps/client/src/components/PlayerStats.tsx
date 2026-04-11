interface PlayerStatsProps {
  score: number;
  moves: number;
  totalCells: number;
}

export function PlayerStats({ score, moves, totalCells }: PlayerStatsProps) {
  const clearPct = totalCells > 0 ? Math.round((score / totalCells) * 100) : 0;
  const efficiency = moves > 0 ? (score / moves).toFixed(1) : '0.0';

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
          <div className="text-lg font-bold text-amber-600 tabular-nums">{efficiency}</div>
          <div className="text-[10px] text-gray-400 uppercase">Apples / Move</div>
        </div>
      </div>
    </div>
  );
}
