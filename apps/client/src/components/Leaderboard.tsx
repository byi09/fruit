import type { RoomState } from '@fruitbox/shared';

interface ScoreInfo {
  playerId: string;
  score: number;
  movesMade: number;
}

interface LeaderboardProps {
  roomState: RoomState;
  scores: Record<string, ScoreInfo>;
  myPlayerId: string;
  myScore: number;
  myMoves: number;
}

export function Leaderboard({ roomState, scores, myPlayerId, myScore, myMoves }: LeaderboardProps) {
  const players = Object.values(roomState.players)
    .filter((p) => !p.isSpectator)
    .map((p) => {
      const serverScore = scores[p.id];
      const isMe = p.id === myPlayerId;
      return {
        id: p.id,
        name: p.name,
        score: isMe ? myScore : (serverScore?.score ?? p.score),
        movesMade: isMe ? myMoves : (serverScore?.movesMade ?? p.movesMade),
        connected: p.connected,
      };
    })
    .sort((a, b) => b.score - a.score || a.movesMade - b.movesMade);

  return (
    <div className="panel p-3">
      <h3 className="flex items-center gap-2 label-eyebrow mb-2.5">
        <span>Live Rankings</span>
        <span className="flex-1 h-px bg-border" />
      </h3>
      <div className="space-y-1">
        {players.map((p, i) => {
          const isMe = p.id === myPlayerId;
          const isTop = i === 0;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                isMe ? 'bg-accent/[0.07]' : 'hover:bg-panel-hover'
              } ${!p.connected ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`text-xs tabular-nums w-4 text-right shrink-0 font-display font-bold ${
                    isTop ? 'text-gold' : 'text-text-3'
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`truncate ${isMe ? 'text-text font-semibold' : 'text-text-2'}`}>
                  {p.name}
                </span>
              </div>
              <div className="flex items-center gap-2.5 ml-2 shrink-0">
                <span className="text-text-3 text-xs tabular-nums">{p.movesMade}</span>
                <span
                  className={`font-display font-bold tabular-nums ${
                    isMe ? 'text-accent' : 'text-text'
                  }`}
                >
                  {p.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
