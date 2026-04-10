import type { Board } from '../types/board.js';
import { mulberry32 } from './prng.js';

/**
 * Weighted random value 1-9. Mid-range values (4,5,6) are slightly more
 * common to maximize valid sum-10 rectangles on the board.
 */
const WEIGHTS = [0, 8, 9, 10, 12, 14, 12, 10, 9, 8]; // index 0 unused
const TOTAL_WEIGHT = WEIGHTS.reduce((a, b) => a + b, 0);

function weightedValue(rand: () => number): number {
  const r = rand() * TOTAL_WEIGHT;
  let cumulative = 0;
  for (let i = 1; i <= 9; i++) {
    cumulative += WEIGHTS[i];
    if (r < cumulative) return i;
  }
  return 9;
}

/**
 * Generates a deterministic board from a seed.
 * Same seed + same dimensions always produces the identical board.
 */
export function generateBoard(seed: number, rows: number, cols: number): Board {
  const rand = mulberry32(seed);
  const board: Board = [];
  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      board[r][c] = { value: weightedValue(rand), cleared: false };
    }
  }
  return board;
}
