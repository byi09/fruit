import type { StandingEntry } from '@fruitbox/shared';

interface ResultsProps {
  standings: StandingEntry[];
  myPlayerId: string;
  isHost: boolean;
  onRematch: () => void;
  onLeave: () => void;
}

const RANK_EMOJI = ['', '🥇', '🥈', '🥉'];

export function Results({ standings, myPlayerId, isHost, onRematch, onLeave }: ResultsProps) {
  const winner = standings[0];
  const isWinner = winner?.playerId === myPlayerId;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-lg w-full animate-slide-up">
        {/* Winner announcement */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{isWinner ? '🎉' : '🏁'}</div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {isWinner ? 'You Win!' : `${winner?.playerName} Wins!`}
          </h2>
          <p className="text-gray-500 mt-1">
            {winner?.score} apples cleared in {winner?.movesMade} moves
          </p>
        </div>

        {/* Standings */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Final Standings</h3>
          <div className="space-y-2">
            {standings.map((s) => (
              <div
                key={s.playerId}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  s.playerId === myPlayerId
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-gray-50'
                } ${s.rank === 1 ? 'ring-2 ring-amber-300' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">
                    {RANK_EMOJI[s.rank] || `#${s.rank}`}
                  </span>
                  <div>
                    <span className="font-semibold">{s.playerName}</span>
                    {s.playerId === myPlayerId && (
                      <span className="text-gray-400 ml-1">(you)</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{s.score}</div>
                  <div className="text-xs text-gray-400">{s.movesMade} moves</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tie-break explanation */}
        {standings.length > 1 && standings[0].score === standings[1].score && (
          <div className="mb-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
            Tie broken by: fewer moves, then earliest final move.
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button className="btn-primary w-full text-lg" onClick={onRematch}>
              Play Again
            </button>
          ) : (
            <p className="text-center text-gray-500">Waiting for host to start rematch...</p>
          )}
          <button
            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors"
            onClick={onLeave}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
