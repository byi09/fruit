import { describe, it, expect } from 'vitest';
import { compareStandings, computeStandings } from '../src/scoring';
import type { StandingEntry } from '../src/types/events';
import type { PlayerState } from '../src/types/player';

function entry(overrides: Partial<StandingEntry> = {}): StandingEntry {
  return {
    playerId: 'p1',
    playerName: 'Player 1',
    score: 0,
    movesMade: 0,
    lastMoveAt: 0,
    rank: 0,
    ...overrides,
  };
}

describe('compareStandings', () => {
  it('ranks higher score first', () => {
    const a = entry({ score: 20 });
    const b = entry({ score: 10 });
    expect(compareStandings(a, b)).toBeLessThan(0);
  });

  it('ranks fewer moves first on score tie', () => {
    const a = entry({ score: 10, movesMade: 3 });
    const b = entry({ score: 10, movesMade: 5 });
    expect(compareStandings(a, b)).toBeLessThan(0);
  });

  it('ranks earlier last move first on score and moves tie', () => {
    const a = entry({ score: 10, movesMade: 3, lastMoveAt: 1000 });
    const b = entry({ score: 10, movesMade: 3, lastMoveAt: 2000 });
    expect(compareStandings(a, b)).toBeLessThan(0);
  });

  it('returns 0 for identical entries', () => {
    const a = entry({ score: 10, movesMade: 3, lastMoveAt: 1000 });
    const b = entry({ score: 10, movesMade: 3, lastMoveAt: 1000 });
    expect(compareStandings(a, b)).toBe(0);
  });
});

describe('computeStandings', () => {
  it('computes correct rankings for multiple players', () => {
    const players: Record<string, PlayerState> = {
      p1: { id: 'p1', name: 'Alice', socketId: 's1', connected: true, score: 15, movesMade: 5, lastMoveAt: 1000 },
      p2: { id: 'p2', name: 'Bob', socketId: 's2', connected: true, score: 20, movesMade: 4, lastMoveAt: 2000 },
      p3: { id: 'p3', name: 'Charlie', socketId: 's3', connected: true, score: 15, movesMade: 3, lastMoveAt: 1500 },
    };

    const standings = computeStandings(players);
    expect(standings[0].playerName).toBe('Bob');      // highest score
    expect(standings[0].rank).toBe(1);
    expect(standings[1].playerName).toBe('Charlie');   // tied score, fewer moves
    expect(standings[1].rank).toBe(2);
    expect(standings[2].playerName).toBe('Alice');     // tied score, more moves
    expect(standings[2].rank).toBe(3);
  });

  it('handles single player', () => {
    const players: Record<string, PlayerState> = {
      p1: { id: 'p1', name: 'Solo', socketId: 's1', connected: true, score: 10, movesMade: 2 },
    };
    const standings = computeStandings(players);
    expect(standings.length).toBe(1);
    expect(standings[0].rank).toBe(1);
    expect(standings[0].lastMoveAt).toBe(Infinity); // no lastMoveAt set
  });

  it('handles all players with zero score', () => {
    const players: Record<string, PlayerState> = {
      p1: { id: 'p1', name: 'A', socketId: 's1', connected: true, score: 0, movesMade: 0 },
      p2: { id: 'p2', name: 'B', socketId: 's2', connected: true, score: 0, movesMade: 0 },
    };
    const standings = computeStandings(players);
    expect(standings.length).toBe(2);
    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(2);
  });
});
