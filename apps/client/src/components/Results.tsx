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

const RANK_EMOJI = ['', '🥇', '🥈', '🥉'];

const PLAYER_COLORS = [
  '#10b981', '#f59e0b', '#3b82f6', '#ef4444',
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

  // Build cumulative scores from round history
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

  // Sort by cumulative score
  const cumulativeRanking = [...playerIds].sort(
    (a, b) => (cumulativeScores[b] ?? 0) - (cumulativeScores[a] ?? 0),
  );

  // Assign stable colors per player
  const playerColorMap: Record<string, string> = {};
  playerIds.forEach((id, i) => { playerColorMap[id] = PLAYER_COLORS[i % PLAYER_COLORS.length]; });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full animate-slide-up">
        {/* Winner announcement */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{isWinner ? '🎉' : '🏁'}</div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            {isWinner ? 'You Win!' : `${winner?.playerName} Wins!`}
          </h2>
          <p className="text-gray-500 mt-1">
            Round {roundNumber} — {winner?.score} apples cleared in {winner?.movesMade} moves
          </p>
        </div>

        {/* This round's standings */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Round {roundNumber} Results</h3>
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
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: playerColorMap[s.playerId] }} />
                    <span className="font-semibold">{s.playerName}</span>
                    {s.playerId === myPlayerId && (
                      <span className="text-gray-400">(you)</span>
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

        {/* Cumulative scores + chart (only show after 1+ rounds) */}
        {roundHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">
              Overall Standings
              {roundHistory.length > 1 && ` (${roundHistory.length} rounds)`}
            </h3>

            {/* Cumulative score bars */}
            <div className="space-y-2 mb-5">
              {cumulativeRanking.map((id, i) => {
                const maxScore = Math.max(...Object.values(cumulativeScores), 1);
                const pct = ((cumulativeScores[id] ?? 0) / maxScore) * 100;
                return (
                  <div key={id} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-5 text-right">{i + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-medium ${id === myPlayerId ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {playerNames[id]}
                        </span>
                        <span className="text-sm font-bold tabular-nums">{cumulativeScores[id]}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: playerColorMap[id] }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Round-by-round chart (show when 2+ rounds) */}
            {roundHistory.length >= 2 && (
              <ScoreChart
                roundHistory={roundHistory}
                playerIds={playerIds}
                playerNames={playerNames}
                playerColors={playerColorMap}
                myPlayerId={myPlayerId}
              />
            )}
          </div>
        )}

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

// SVG bar chart showing score per round per player
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
  const chartHeight = 180;
  const paddingLeft = 35;
  const paddingBottom = 28;
  const paddingTop = 10;
  const paddingRight = 10;

  const plotW = chartWidth - paddingLeft - paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  const numRounds = roundHistory.length;
  const numPlayers = playerIds.length;

  // Find max score in any single round
  let maxScore = 0;
  for (const round of roundHistory) {
    for (const s of round.standings) {
      if (s.score > maxScore) maxScore = s.score;
    }
  }
  if (maxScore === 0) maxScore = 1;

  const groupWidth = plotW / numRounds;
  const barWidth = Math.min(24, (groupWidth * 0.75) / numPlayers);
  const groupBarWidth = barWidth * numPlayers;

  // Build score lookup: roundIndex -> playerId -> score
  const scoreMap: Record<number, Record<string, number>> = {};
  roundHistory.forEach((round, i) => {
    scoreMap[i] = {};
    for (const s of round.standings) {
      scoreMap[i][s.playerId] = s.score;
    }
  });

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-2">Score per Round</h4>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full" style={{ maxHeight: 200 }}>
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = paddingTop + plotH * (1 - frac);
          const val = Math.round(maxScore * frac);
          return (
            <g key={frac}>
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize={10}>
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
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
                x={x}
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

        {/* X-axis labels */}
        {roundHistory.map((round, ri) => {
          const x = paddingLeft + ri * groupWidth + groupWidth / 2;
          return (
            <text key={ri} x={x} y={chartHeight - 8} textAnchor="middle" fill="#6b7280" fontSize={11}>
              R{round.roundNumber}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {playerIds.map((id) => (
          <div key={id} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: playerColors[id] }} />
            <span className={id === myPlayerId ? 'font-semibold' : ''}>{playerNames[id]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
