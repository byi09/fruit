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
      // Use server score if available, otherwise client score for self
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
    <div className="bg-white/90 backdrop-blur rounded-xl shadow-md p-3 sm:p-4">
      <h3 className="font-bold text-gray-700 text-sm mb-2">Leaderboard</h3>
      <div className="space-y-1.5">
        {players.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm ${
              p.id === myPlayerId ? 'bg-emerald-50 font-semibold' : ''
            } ${!p.connected ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-gray-400 w-4 text-right">{i + 1}.</span>
              <span className="truncate">{p.name}</span>
            </div>
            <div className="flex items-center gap-3 ml-2">
              <span className="text-gray-400 text-xs">{p.movesMade} moves</span>
              <span className={`font-bold tabular-nums ${p.id === myPlayerId ? 'text-emerald-600' : 'text-gray-700'}`}>
                {p.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
