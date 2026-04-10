import { describe, it, expect } from 'vitest';
import { validateMove, applyMove, normalizeMove, getRectangleSum } from '../src/board/validate';
import type { Board, Move } from '../src/types/board';

function makeBoard(values: number[][]): Board {
  return values.map((row) => row.map((value) => ({ value, cleared: false })));
}

describe('normalizeMove', () => {
  it('normalizes top-left to bottom-right drag', () => {
    const move: Move = { startRow: 0, startCol: 0, endRow: 2, endCol: 2 };
    expect(normalizeMove(move)).toEqual(move);
  });

  it('normalizes bottom-right to top-left drag', () => {
    expect(normalizeMove({ startRow: 2, startCol: 2, endRow: 0, endCol: 0 }))
      .toEqual({ startRow: 0, startCol: 0, endRow: 2, endCol: 2 });
  });

  it('normalizes top-right to bottom-left drag', () => {
    expect(normalizeMove({ startRow: 0, startCol: 3, endRow: 2, endCol: 0 }))
      .toEqual({ startRow: 0, startCol: 0, endRow: 2, endCol: 3 });
  });

  it('handles single cell selection', () => {
    const move: Move = { startRow: 1, startCol: 1, endRow: 1, endCol: 1 };
    expect(normalizeMove(move)).toEqual(move);
  });
});

describe('validateMove', () => {
  const board = makeBoard([
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 1, 2, 3],
  ]);

  it('validates a valid sum-10 selection', () => {
    // Select cells: 1+2+3+4 = 10
    const result = validateMove(board, { startRow: 0, startCol: 0, endRow: 0, endCol: 3 }, 10);
    expect(result).toEqual({ valid: true, cellsCleared: 4 });
  });

  it('rejects when sum != target', () => {
    // Select cells: 1+2 = 3
    const result = validateMove(board, { startRow: 0, startCol: 0, endRow: 0, endCol: 1 }, 10);
    expect(result).toEqual({ valid: false, cellsCleared: 0, reason: 'sum_not_target' });
  });

  it('rejects out of bounds move', () => {
    const result = validateMove(board, { startRow: 0, startCol: 0, endRow: 5, endCol: 0 }, 10);
    expect(result).toEqual({ valid: false, cellsCleared: 0, reason: 'out_of_bounds' });
  });

  it('rejects negative indices', () => {
    const result = validateMove(board, { startRow: -1, startCol: 0, endRow: 0, endCol: 0 }, 10);
    expect(result).toEqual({ valid: false, cellsCleared: 0, reason: 'out_of_bounds' });
  });

  it('validates single cell equal to target', () => {
    // Cell at [1][0] = 5, but target=10, so invalid
    const result = validateMove(board, { startRow: 1, startCol: 0, endRow: 1, endCol: 0 }, 10);
    expect(result).toEqual({ valid: false, cellsCleared: 0, reason: 'sum_not_target' });

    // With target=5, single cell should be valid
    const result2 = validateMove(board, { startRow: 1, startCol: 0, endRow: 1, endCol: 0 }, 5);
    expect(result2).toEqual({ valid: true, cellsCleared: 1 });
  });

  it('excludes cleared cells from sum', () => {
    const boardWithCleared: Board = [
      [{ value: 1, cleared: true }, { value: 2, cleared: false }, { value: 8, cleared: false }],
    ];
    // Sum of uncleared: 2+8 = 10
    const result = validateMove(boardWithCleared, { startRow: 0, startCol: 0, endRow: 0, endCol: 2 }, 10);
    expect(result).toEqual({ valid: true, cellsCleared: 2 });
  });

  it('rejects selection of all cleared cells', () => {
    const allCleared: Board = [
      [{ value: 5, cleared: true }, { value: 5, cleared: true }],
    ];
    const result = validateMove(allCleared, { startRow: 0, startCol: 0, endRow: 0, endCol: 1 }, 10);
    expect(result).toEqual({ valid: false, cellsCleared: 0, reason: 'no_uncleared_cells' });
  });

  it('handles reverse-direction drag', () => {
    // Same as first test but dragged bottom-right to top-left
    const result = validateMove(board, { startRow: 0, startCol: 3, endRow: 0, endCol: 0 }, 10);
    expect(result).toEqual({ valid: true, cellsCleared: 4 });
  });

  it('validates 2D rectangle selection', () => {
    // Select 2x2: [1,2],[5,6] = 14, not 10
    const result = validateMove(board, { startRow: 0, startCol: 0, endRow: 1, endCol: 1 }, 10);
    expect(result).toEqual({ valid: false, cellsCleared: 0, reason: 'sum_not_target' });
  });

  it('validates column selection', () => {
    // Column 0: 1+5+9 = 15
    const result = validateMove(board, { startRow: 0, startCol: 0, endRow: 2, endCol: 0 }, 10);
    expect(result).toEqual({ valid: false, cellsCleared: 0, reason: 'sum_not_target' });
  });
});

describe('applyMove', () => {
  it('clears cells in the selected rectangle', () => {
    const board = makeBoard([[1, 2, 3], [4, 5, 6]]);
    const newBoard = applyMove(board, { startRow: 0, startCol: 0, endRow: 0, endCol: 2 });

    // First row should be cleared
    expect(newBoard[0][0].cleared).toBe(true);
    expect(newBoard[0][1].cleared).toBe(true);
    expect(newBoard[0][2].cleared).toBe(true);
    // Second row unchanged
    expect(newBoard[1][0].cleared).toBe(false);
    expect(newBoard[1][1].cleared).toBe(false);
  });

  it('does not mutate the original board', () => {
    const board = makeBoard([[1, 2], [3, 4]]);
    const newBoard = applyMove(board, { startRow: 0, startCol: 0, endRow: 0, endCol: 1 });
    expect(board[0][0].cleared).toBe(false);
    expect(newBoard[0][0].cleared).toBe(true);
  });

  it('does not re-clear already cleared cells (values preserved)', () => {
    const board: Board = [
      [{ value: 5, cleared: true }, { value: 5, cleared: false }],
    ];
    const newBoard = applyMove(board, { startRow: 0, startCol: 0, endRow: 0, endCol: 1 });
    expect(newBoard[0][0].cleared).toBe(true);
    expect(newBoard[0][0].value).toBe(5);
    expect(newBoard[0][1].cleared).toBe(true);
  });
});

describe('getRectangleSum', () => {
  it('returns sum and count of uncleared cells', () => {
    const board = makeBoard([[1, 2, 3], [4, 5, 6]]);
    const result = getRectangleSum(board, { startRow: 0, startCol: 0, endRow: 0, endCol: 2 });
    expect(result).toEqual({ sum: 6, count: 3 });
  });

  it('excludes cleared cells', () => {
    const board: Board = [
      [{ value: 5, cleared: true }, { value: 3, cleared: false }, { value: 7, cleared: false }],
    ];
    const result = getRectangleSum(board, { startRow: 0, startCol: 0, endRow: 0, endCol: 2 });
    expect(result).toEqual({ sum: 10, count: 2 });
  });
});
