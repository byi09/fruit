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
      <h3 className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-2.5">Leaderboard</h3>
      <div className="space-y-1">
        {players.map((p, i) => {
          const isMe = p.id === myPlayerId;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                isMe ? 'bg-accent/10' : 'hover:bg-white/[0.03]'
              } ${!p.connected ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-white/25 text-xs tabular-nums w-3 text-right shrink-0">{i + 1}</span>
                <span className={`truncate ${isMe ? 'text-white font-medium' : 'text-white/60'}`}>
                  {p.name}
                </span>
              </div>
              <div className="flex items-center gap-2.5 ml-2 shrink-0">
                <span className="text-white/25 text-xs tabular-nums">{p.movesMade}</span>
                <span className={`font-bold tabular-nums ${isMe ? 'text-accent-light' : 'text-white/80'}`}>
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
