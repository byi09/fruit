import { useState, useCallback } from 'react';
import type { StandingEntry, RoundResult, GameConfig } from '@fruitbox/shared';
import { generateBoard } from '@fruitbox/shared';
import { useSolver } from '../hooks/useSolver';
import { ReplayViewer } from './ReplayViewer';
import { ThemeToggle } from './ThemeToggle';

interface ResultsProps {
  standings: StandingEntry[];
  roundNumber: number;
  roundHistory: RoundResult[];
  myPlayerId: string;
  isHost: boolean;
  seed: number | null;
  config: GameConfig | null;
  onRematch: () => void;
  onLeave: () => void;
}

const RANK_LABELS = ['', '1st', '2nd', '3rd'];
const RANK_COLORS: Record<number, string> = {
  1: 'var(--gold)',
  2: 'var(--rank-silver)',
  3: 'var(--rank-bronze)',
};

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
  seed,
  config,
  onRematch,
  onLeave,
}: ResultsProps) {
  const winner = standings[0];
  const isWinner = winner?.playerId === myPlayerId;
  const { solution, isRunning, startSolve } = useSolver();
  const [showReplay, setShowReplay] = useState(false);

  const handleSolve = useCallback(() => {
    if (seed == null || !config) return;
    if (solution) {
      setShowReplay(true);
      return;
    }
    const initialBoard = generateBoard(seed, config.rows, config.cols);
    startSolve(initialBoard, config.targetSum);
  }, [seed, config, solution, startSolve]);

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
    <div
      className="relative min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--results-hero-bg)' }}
    >
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-xl animate-slide-up">
        {/* Winner */}
        <div className="text-center mb-8">
          <div className="text-[52px] leading-none mb-3 select-none">
            {isWinner ? '🏆' : '🏁'}
          </div>
          <h2
            className="font-display font-extrabold tracking-tight gradient-text"
            style={{ fontSize: 36, letterSpacing: '-0.02em' }}
          >
            {isWinner ? 'You Win!' : `${winner?.playerName} Wins!`}
          </h2>
          <p className="text-text-2 text-sm mt-2">
            Round {roundNumber} — {winner?.score} cleared in {winner?.movesMade} moves
          </p>
        </div>

        {/* Standings */}
        <div className="panel p-5 mb-4">
          <h3 className="label-eyebrow mb-3">Round {roundNumber}</h3>
          <div className="space-y-1.5">
            {standings.map((s) => {
              const isMe = s.playerId === myPlayerId;
              const rankColor = RANK_COLORS[s.rank];
              return (
                <div
                  key={s.playerId}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${
                    isMe ? 'bg-accent/[0.07]' : 'hover:bg-panel-hover'
                  } ${s.rank === 1 ? 'ring-1 ring-gold/30' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-display text-[11px] font-bold w-8 text-center"
                      style={{ color: rankColor ?? 'var(--text-3)' }}
                    >
                      {RANK_LABELS[s.rank] || `#${s.rank}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: playerColorMap[s.playerId] }}
                      />
                      <span className={`text-sm ${isMe ? 'font-semibold text-text' : 'text-text-2'}`}>
                        {s.playerName}
                        {isMe && <span className="text-text-3 font-normal ml-1">(you)</span>}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="font-display text-[17px] font-extrabold tabular-nums"
                      style={{ color: s.rank === 1 ? 'var(--gold)' : 'var(--text)' }}
                    >
                      {s.score}
                    </span>
                    <span className="text-xs text-text-3 ml-2">{s.movesMade}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cumulative */}
        {roundHistory.length > 0 && (
          <div className="panel p-5 mb-4">
            <h3 className="label-eyebrow mb-3">
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
                        <span className="font-display text-xs text-text-3 tabular-nums w-4 text-right">{i + 1}</span>
                        <span className={`text-sm ${isMe ? 'font-semibold text-text' : 'text-text-2'}`}>
                          {playerNames[id]}
                        </span>
                      </div>
                      <span className="font-display text-sm font-bold tabular-nums text-text">
                        {cumulativeScores[id]}
                      </span>
                    </div>
                    <div
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ background: 'var(--progress-track)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-[900ms]"
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
          <div className="mb-4 px-3 py-2.5 bg-indigo-accent/10 border border-indigo-accent/30 rounded-lg text-sm text-indigo-accent">
            Tie broken by: fewer moves, then earliest final move.
          </div>
        )}

        {/* Best Solution */}
        {seed != null && config && (
          <div className="mb-4">
            <button
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                         bg-emerald/10 hover:bg-emerald/15 text-emerald border border-emerald/25
                         transition-all disabled:opacity-50"
              onClick={handleSolve}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
                  Solving... {solution ? `(${solution.totalCleared} cleared so far)` : ''}
                </>
              ) : solution ? (
                <>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <polygon points="4,2 14,8 4,14" />
                  </svg>
                  Watch Replay — {solution.totalCleared}/{config.rows * config.cols} cleared
                </>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm-.5 2.5v4l3.5 2-.5.86-4-2.36V4.5h1z"/>
                  </svg>
                  Show Best Solution
                </>
              )}
            </button>
          </div>
        )}

        {showReplay && solution && seed != null && config && (
          <ReplayViewer
            initialBoard={generateBoard(seed, config.rows, config.cols)}
            config={config}
            solution={solution}
            onClose={() => setShowReplay(false)}
          />
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isHost ? (
            <button className="btn-primary w-full" onClick={onRematch}>
              Play Again
            </button>
          ) : (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 text-sm text-text-2">
                <span className="pulse-dot" />
                Waiting for host to start rematch
              </div>
            </div>
          )}
          <button className="btn-ghost w-full text-sm" onClick={onLeave}>
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
  const VISIBLE_ROUNDS = 5;
  const GROUP_WIDTH = 80;
  const chartHeight = 160;
  const paddingLeft = 32;
  const paddingBottom = 24;
  const paddingTop = 8;
  const paddingRight = 8;

  const numRounds = Math.max(roundHistory.length, 1);
  const numPlayers = playerIds.length;

  const plotW = GROUP_WIDTH * numRounds;
  const chartWidth = paddingLeft + plotW + paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  let maxScore = 0;
  for (const round of roundHistory) {
    for (const s of round.standings) {
      if (s.score > maxScore) maxScore = s.score;
    }
  }
  if (maxScore === 0) maxScore = 1;

  const groupWidth = GROUP_WIDTH;
  const barWidth = Math.min(20, (groupWidth * 0.7) / numPlayers);
  const groupBarWidth = barWidth * numPlayers;
  const scrolls = roundHistory.length > VISIBLE_ROUNDS;

  const scoreMap: Record<number, Record<string, number>> = {};
  roundHistory.forEach((round, i) => {
    scoreMap[i] = {};
    for (const s of round.standings) {
      scoreMap[i][s.playerId] = s.score;
    }
  });

  return (
    <div>
      <h4 className="label-eyebrow mb-2">Per Round</h4>
      <div className={scrolls ? 'overflow-x-auto' : ''}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width={chartWidth}
        height={chartHeight}
        style={{ maxHeight: 180, display: 'block' }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = paddingTop + plotH * (1 - frac);
          const val = Math.round(maxScore * frac);
          return (
            <g key={frac}>
              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="var(--chart-axis)" strokeWidth={1} />
              <text x={paddingLeft - 6} y={y + 3.5} textAnchor="end" fill="var(--chart-label)" fontSize={9} fontFamily="Inter, system-ui, sans-serif">
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
            <text key={ri} x={x} y={chartHeight - 6} textAnchor="middle" fill="var(--chart-label)" fontSize={10} fontFamily="Inter, system-ui, sans-serif">
              R{round.roundNumber}
            </text>
          );
        })}
      </svg>
      </div>

      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {playerIds.map((id) => (
          <div key={id} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: playerColors[id] }} />
            <span className={`${id === myPlayerId ? 'font-semibold text-text' : 'text-text-2'}`}>
              {playerNames[id]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
