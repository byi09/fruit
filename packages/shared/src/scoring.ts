import type { StandingEntry } from './types/events.js';
import type { PlayerState } from './types/player.js';

/**
 * Compares two standings for sorting:
 * 1. Most apples cleared (descending)
 * 2. Fewest moves made (ascending)
 * 3. Earliest last move (ascending — faster player wins tie)
 */
export function compareStandings(a: StandingEntry, b: StandingEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.movesMade !== b.movesMade) return a.movesMade - b.movesMade;
  return a.lastMoveAt - b.lastMoveAt;
}

/**
 * Computes final standings from player states.
 */
export function computeStandings(players: Record<string, PlayerState>): StandingEntry[] {
  const entries: StandingEntry[] = Object.values(players)
    .filter((p) => !p.isSpectator)
    .map((p) => ({
      playerId: p.id,
      playerName: p.name,
      score: p.score,
      movesMade: p.movesMade,
      lastMoveAt: p.lastMoveAt ?? Infinity,
      rank: 0,
    }));

  entries.sort(compareStandings);
  entries.forEach((e, i) => {
    e.rank = i + 1;
  });
  return entries;
}
