import type { PlayerState } from '@fruitbox/shared';

interface ScoreInfo {
  playerId: string;
  score: number;
  movesMade: number;
}

interface BoardSwitcherProps {
  players: PlayerState[];
  viewedPlayerId: string | null;
  scores: Record<string, ScoreInfo>;
  onSelect: (playerId: string) => void;
}

export function BoardSwitcher({ players, viewedPlayerId, scores, onSelect }: BoardSwitcherProps) {
  const active = players.filter((p) => !p.isSpectator);
  if (active.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mb-3 flex items-center gap-2 overflow-x-auto pb-1">
      {active.map((p) => {
        const isActive = p.id === viewedPlayerId;
        const score = scores[p.id]?.score ?? p.score;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${
              isActive
                ? 'bg-accent/10 text-stone-900 border-accent/30 shadow-sm'
                : 'bg-white text-stone-500 hover:text-stone-800 border-stone-200/60'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                p.connected ? 'bg-emerald-400' : 'bg-stone-300'
              }`}
            />
            <span>{p.name}</span>
            <span className="tabular-nums text-xs text-stone-400">{score}</span>
          </button>
        );
      })}
    </div>
  );
}
