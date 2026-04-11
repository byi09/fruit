import type { StandingEntry, RoundResult } from '@fruitbox/shared';

interface ResultsProps {
  standings: StandingEntry[];
  roundNumber: number;
  roundHistory: RoundResult[];
  myPlayerId: string;
  isHost: boolean;
  onRematch: () => void;
  onLeave: () => void;
}

const RANK_LABELS = ['', '1st', '2nd', '3rd'];

const PLAYER_COLORS = [
  '#e94560', '#f59e0b', '#3b82f6', '#10b981',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

export function Results({
  standings,
  roundNumber,
  roundHistory,
  myPlayerId,
  isHost,
  onRematch,
  onLeave,
}: ResultsProps) {
  const winner = standings[0];
  const isWinner = winner?.playerId === myPlayerId;

  const playerIds = standings.map((s) => s.playerId);
  const playerNames: Record<string, string> = {};
  standings.forEach((s) => { playerNames[s.playerId] = s.playerName; });

  const cumulativeScores: Record<string, number> = {};
  playerIds.forEach((id) => { cumulativeScores[id] = 0; });

  for (const round of roundHistory) {
    for (const s of round.standings) {
      if (cumulativeScores[s.playerId] !== undefined) {
        cumulativeScores[s.playerId] += s.score;
      }
    }
  }

  const cumulativeRanking = [...playerIds].sort(
    (a, b) => (cumulativeScores[b] ?? 0) - (cumulativeScores[a] ?? 0),
  );

  const playerColorMap: Record<string, string> = {};
  playerIds.forEach((id, i) => { playerColorMap[id] = PLAYER_COLORS[i % PLAYER_COLORS.length]; });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
      <div className="w-full max-w-xl animate-slide-up">
        {/* Winner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-4">
            <span className="text-3xl">{isWinner ? '🎉' : '🏁'}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            {isWinner ? 'You Win!' : `${winner?.playerName} Wins!`}
          </h2>
          <p className="text-stone-400 text-sm mt-1">
            Round {roundNumber} — {winner?.score} cleared in {winner?.movesMade} moves
          </p>
        </div>

        {/* Standings */}
        <div className="panel-light p-5 mb-4">
          <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
            Round {roundNumber}
          </h3>
          <div className="space-y-1.5">
            {standings.map((s) => {
              const isMe = s.playerId === myPlayerId;
              return (
                <div
                  key={s.playerId}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                    isMe ? 'bg-accent/[0.06]' : 'hover:bg-stone-50'
                  } ${s.rank === 1 ? 'ring-1 ring-accent/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-stone-400 w-6 text-center">
                      {RANK_LABELS[s.rank] || `#${s.rank}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: playerColorMap[s.playerId] }} />
                      <span className={`text-sm ${isMe ? 'font-semibold text-stone-900' : 'text-stone-700'}`}>
                        {s.playerName}
                        {isMe && <span className="text-stone-400 font-normal ml-1">(you)</span>}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold tabular-nums text-stone-800">{s.score}</span>
                    <span className="text-xs text-stone-400 ml-2">{s.movesMade}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cumulative */}
        {roundHistory.length > 0 && (
          <div className="panel-light p-5 mb-4">
            <h3 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
              Overall{roundHistory.length > 1 ? ` (${roundHistory.length} rounds)` : ''}
            </h3>

            <div className="space-y-2.5">
              {cumulativeRanking.map((id, i) => {
                const maxScore = Math.max(...Object.values(cumulativeScores), 1);
                const pct = ((cumulativeScores[id] ?? 0) / maxScore) * 100;
                const isMe = id === myPlayerId;
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 tabular-nums w-4 text-right">{i + 1}</span>
                        <span className={`text-sm ${isMe ? 'font-semibold text-stone-900' : 'text-stone-600'}`}>
                          {playerNames[id]}
                        </span>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-stone-800">{cumulativeScores[id]}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: playerColorMap[id] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {roundHistory.length >= 2 && (
              <div className="mt-5">
                <ScoreChart
                  roundHistory={roundHistory}
                  playerIds={playerIds}
                  playerNames={playerNames}
                  playerColors={playerColorMap}
                  myPlayerId={myPlayerId}
                />
              </div>
            )}
          </div>
        )}

        {/* Tie-break */}
        {standings.length > 1 && standings[0].score === standings[1].score && (
          <div className="mb-4 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-600">
            Tie broken by: fewer moves, then earliest final move.
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isHost ? (
            <button className="btn-primary w-full" onClick={onRematch}>
              Play Again
            </button>
          ) : (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 text-sm text-stone-400">
                <div className="w-1 h-1 rounded-full bg-stone-300 animate-pulse" />
                Waiting for host to start rematch
              </div>
            </div>
          )}
          <button
            className="btn-ghost w-full text-sm"
            onClick={onLeave}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreChart({
  roundHistory,
  playerIds,
  playerNames,
  playerColors,
  myPlayerId,
}: {
  roundHistory: RoundResult[];
  playerIds: string[];
  playerNames: Record<string, string>;
  playerColors: Record<string, string>;
  myPlayerId: string;
}) {
  const chartWidth = 500;
  const chartHeight = 160;
  const paddingLeft = 32;
  const paddingBottom = 24;
  const paddingTop = 8;
  const paddingRight = 8;

  const plotW = chartWidth - paddingLeft - paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  const numRounds = roundHistory.length;
  const numPlayers = playerIds.length;

  let maxScore = 0;
  for (const round of roundHistory) {
    for (const s of round.standings) {
      if (s.score > maxScore) maxScore = s.score;
    }
  }
  if (maxScore === 0) maxScore = 1;

  const groupWidth = plotW / numRounds;
  const barWidth = Math.min(20, (groupWidth * 0.7) / numPlayers);
  const groupBarWidth = barWidth * numPlayers;

  const scoreMap: Record<number, Record<string, number>> = {};
  roundHistory.forEach((round, i) => {
    scoreMap[i] = {};
    for (const s of round.standings) {
      scoreMap[i][s.playerId] = s.score;
    }
  });

  return (
    <div>
      <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Per Round</h4>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ maxHeight: 180 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = paddingTop + plotH * (1 - frac);
          const val = Math.round(maxScore * frac);
          return (
            <g key={frac}>
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#f5f5f4" strokeWidth={1} />
              <text x={paddingLeft - 6} y={y + 3.5} textAnchor="end" fill="#a8a29e" fontSize={9} fontFamily="Inter, system-ui, sans-serif">
                {val}
              </text>
            </g>
          );
        })}

        {roundHistory.map((_round, ri) => {
          const groupX = paddingLeft + ri * groupWidth + (groupWidth - groupBarWidth) / 2;
          return playerIds.map((id, pi) => {
            const score = scoreMap[ri]?.[id] ?? 0;
            const barH = (score / maxScore) * plotH;
            const x = groupX + pi * barWidth;
            const y = paddingTop + plotH - barH;
            return (
              <rect
                key={`${ri}-${id}`}
                x={x + 0.5}
                y={y}
                width={barWidth - 1}
                height={barH}
                rx={2}
                fill={playerColors[id]}
                opacity={0.85}
              />
            );
          });
        })}

        {roundHistory.map((round, ri) => {
          const x = paddingLeft + ri * groupWidth + groupWidth / 2;
          return (
            <text key={ri} x={x} y={chartHeight - 6} textAnchor="middle" fill="#a8a29e" fontSize={10} fontFamily="Inter, system-ui, sans-serif">
              R{round.roundNumber}
            </text>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {playerIds.map((id) => (
          <div key={id} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: playerColors[id] }} />
            <span className={`${id === myPlayerId ? 'font-semibold text-stone-700' : 'text-stone-500'}`}>
              {playerNames[id]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
