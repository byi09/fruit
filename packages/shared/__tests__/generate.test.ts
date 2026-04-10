import { describe, it, expect } from 'vitest';
import { generateBoard } from '../src/board/generate';

describe('generateBoard', () => {
  it('creates a board with correct dimensions', () => {
    const board = generateBoard(42, 10, 17);
    expect(board.length).toBe(10);
    for (const row of board) {
      expect(row.length).toBe(17);
    }
  });

  it('all cells have values 1-9 and are not cleared', () => {
    const board = generateBoard(123, 10, 17);
    for (const row of board) {
      for (const cell of row) {
        expect(cell.value).toBeGreaterThanOrEqual(1);
        expect(cell.value).toBeLessThanOrEqual(9);
        expect(cell.cleared).toBe(false);
      }
    }
  });

  it('same seed produces identical board', () => {
    for (let seed = 0; seed < 100; seed++) {
      const board1 = generateBoard(seed, 10, 17);
      const board2 = generateBoard(seed, 10, 17);
      expect(board1).toEqual(board2);
    }
  });

  it('different seeds produce different boards', () => {
    const board1 = generateBoard(1, 10, 17);
    const board2 = generateBoard(2, 10, 17);
    // Extract all values to compare
    const values1 = board1.flat().map((c) => c.value);
    const values2 = board2.flat().map((c) => c.value);
    expect(values1).not.toEqual(values2);
  });

  it('works with custom dimensions', () => {
    const board = generateBoard(42, 5, 8);
    expect(board.length).toBe(5);
    expect(board[0].length).toBe(8);
  });

  it('all 9 values appear in a 10x17 board', () => {
    const board = generateBoard(42, 10, 17);
    const values = new Set(board.flat().map((c) => c.value));
    for (let v = 1; v <= 9; v++) {
      expect(values.has(v)).toBe(true);
    }
  });

  it('weighted distribution favors mid-range values', () => {
    // Generate many boards and count value frequencies
    const counts = new Array(10).fill(0); // index 0 unused
    for (let seed = 0; seed < 50; seed++) {
      const board = generateBoard(seed, 10, 17);
      for (const row of board) {
        for (const cell of row) {
          counts[cell.value]++;
        }
      }
    }
    // 5 should be the most common (weight 14), 1 and 9 the least (weight 8)
    expect(counts[5]).toBeGreaterThan(counts[1]);
    expect(counts[5]).toBeGreaterThan(counts[9]);
  });

  it('board has valid sum-10 rectangles (playability check)', () => {
    const board = generateBoard(42, 10, 17);
    let validRectangles = 0;

    // Check all possible rectangles
    for (let r1 = 0; r1 < 10; r1++) {
      for (let c1 = 0; c1 < 17; c1++) {
        for (let r2 = r1; r2 < 10; r2++) {
          for (let c2 = c1; c2 < 17; c2++) {
            let sum = 0;
            for (let r = r1; r <= r2; r++) {
              for (let c = c1; c <= c2; c++) {
                sum += board[r][c].value;
              }
            }
            if (sum === 10) validRectangles++;
          }
        }
      }
    }
    // A 10x17 board should have many valid rectangles
    expect(validRectangles).toBeGreaterThan(10);
  });
});
