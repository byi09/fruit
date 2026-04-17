import { describe, it, expect } from 'vitest';
import { findAllValidMoves, countUncleared, buildPrefixSum, queryRectSum } from '../src/solver/enumerate';
import { solveBoardGreedy, solveBoardBeam } from '../src/solver/solver';
import { applyMove } from '../src/board/validate';
import type { Board } from '../src/types/board';

function makeBoard(values: number[][]): Board {
  return values.map((row) => row.map((value) => ({ value, cleared: false })));
}

describe('buildPrefixSum / queryRectSum', () => {
  it('computes correct prefix sums', () => {
    const board = makeBoard([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const prefix = buildPrefixSum(board);
    // Full board sum
    expect(queryRectSum(prefix, 0, 0, 1, 2)).toBe(21);
    // Single cell
    expect(queryRectSum(prefix, 0, 0, 0, 0)).toBe(1);
    expect(queryRectSum(prefix, 1, 2, 1, 2)).toBe(6);
    // First row
    expect(queryRectSum(prefix, 0, 0, 0, 2)).toBe(6);
  });

  it('excludes cleared cells from sum', () => {
    const board = makeBoard([[1, 9, 3]]);
    board[0][1] = { value: 9, cleared: true };
    const prefix = buildPrefixSum(board);
    expect(queryRectSum(prefix, 0, 0, 0, 2)).toBe(4); // 1 + 0 + 3
  });
});

describe('findAllValidMoves', () => {
  it('finds single-cell moves summing to target', () => {
    const board = makeBoard([
      [5, 3, 5],
      [2, 5, 8],
    ]);
    const moves = findAllValidMoves(board, 5);
    // Should find [0,0], [0,2], [1,1] as single-cell moves
    const singleCells = moves.filter(
      (m) => m.startRow === m.endRow && m.startCol === m.endCol,
    );
    expect(singleCells.length).toBe(3);
  });

  it('finds multi-cell rectangles', () => {
    const board = makeBoard([
      [1, 2],
      [3, 4],
    ]);
    const moves = findAllValidMoves(board, 10);
    // Full board sums to 10
    expect(moves.some((m) => m.startRow === 0 && m.startCol === 0 && m.endRow === 1 && m.endCol === 1)).toBe(true);
  });

  it('returns empty for board with no valid moves', () => {
    const board = makeBoard([[1, 1]]);
    const moves = findAllValidMoves(board, 10);
    expect(moves.length).toBe(0);
  });
});

describe('solveBoardGreedy', () => {
  it('finds valid solution for simple board', () => {
    const board = makeBoard([
      [1, 9],
      [5, 5],
    ]);
    const solution = solveBoardGreedy(board, 10);
    expect(solution.totalCleared).toBeGreaterThan(0);
    expect(solution.moves.length).toBeGreaterThan(0);

    // Verify moves are valid by replaying
    let b = board;
    let cleared = 0;
    for (const move of solution.moves) {
      const count = countUncleared(b, move);
      cleared += count;
      b = applyMove(b, move);
    }
    expect(cleared).toBe(solution.totalCleared);
  });

  it('clears entire board when possible', () => {
    // 1+9=10, 5+5=10 — should clear all 4 cells
    const board = makeBoard([
      [1, 9],
      [5, 5],
    ]);
    const solution = solveBoardGreedy(board, 10);
    expect(solution.totalCleared).toBe(4);
  });
});

describe('solveBoardBeam', () => {
  it('finds at least as good a solution as greedy', () => {
    const board = makeBoard([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 1, 2, 3],
    ]);
    const greedy = solveBoardGreedy(board, 10);
    const beam = solveBoardBeam(board, 10, { beamWidth: 50, timeLimitMs: 2000 });
    expect(beam.totalCleared).toBeGreaterThanOrEqual(greedy.totalCleared);
  });

  it('produces valid move sequence', () => {
    const board = makeBoard([
      [3, 7, 2, 8],
      [1, 4, 6, 5],
    ]);
    const solution = solveBoardBeam(board, 10, { beamWidth: 50, timeLimitMs: 1000 });

    // Verify by replaying
    let b = board;
    let cleared = 0;
    for (const move of solution.moves) {
      const count = countUncleared(b, move);
      expect(count).toBeGreaterThan(0);
      cleared += count;
      b = applyMove(b, move);
    }
    expect(cleared).toBe(solution.totalCleared);
  });
});
