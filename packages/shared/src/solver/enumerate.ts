import type { Board, Move, Cell } from '../types/board.js';

/**
 * Build a 2D prefix sum over uncleared cell values.
 * prefix[r][c] = sum of uncleared values in board[0..r-1][0..c-1].
 */
export function buildPrefixSum(board: Board): number[][] {
  const rows = board.length;
  const cols = board[0].length;
  const prefix: number[][] = [];

  for (let r = 0; r <= rows; r++) {
    prefix[r] = new Array(cols + 1).fill(0);
  }

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const cell = board[r - 1][c - 1];
      const val = cell.cleared ? 0 : cell.value;
      prefix[r][c] = val + prefix[r - 1][c] + prefix[r][c - 1] - prefix[r - 1][c - 1];
    }
  }

  return prefix;
}

/**
 * Query rectangle sum using prefix sums. Coordinates are inclusive board indices.
 */
export function queryRectSum(prefix: number[][], r1: number, c1: number, r2: number, c2: number): number {
  return prefix[r2 + 1][c2 + 1] - prefix[r1][c2 + 1] - prefix[r2 + 1][c1] + prefix[r1][c1];
}

/**
 * Find all valid moves (rectangles summing to targetSum) on the board.
 */
export function findAllValidMoves(board: Board, targetSum: number): Move[] {
  const rows = board.length;
  const cols = board[0].length;
  const prefix = buildPrefixSum(board);
  const moves: Move[] = [];

  for (let r1 = 0; r1 < rows; r1++) {
    for (let c1 = 0; c1 < cols; c1++) {
      // Skip if starting cell is cleared
      if (board[r1][c1].cleared) {
        // Still need to check rectangles starting here — they might contain uncleared cells
      }
      for (let r2 = r1; r2 < rows; r2++) {
        for (let c2 = c1; c2 < cols; c2++) {
          const sum = queryRectSum(prefix, r1, c1, r2, c2);
          // Early termination: if sum already exceeds target, wider rectangles will too
          // (only if no cleared cells in extension — but cleared cells contribute 0, so sum is monotonic)
          if (sum > targetSum) break;
          if (sum === targetSum) {
            // Verify at least one uncleared cell
            if (hasUnclearedCell(board, r1, c1, r2, c2)) {
              moves.push({ startRow: r1, startCol: c1, endRow: r2, endCol: c2 });
            }
          }
        }
      }
    }
  }

  return moves;
}

function hasUnclearedCell(board: Board, r1: number, c1: number, r2: number, c2: number): boolean {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      if (!board[r][c].cleared) return true;
    }
  }
  return false;
}

/**
 * Count uncleared cells in a rectangle.
 */
export function countUncleared(board: Board, move: Move): number {
  let count = 0;
  for (let r = move.startRow; r <= move.endRow; r++) {
    for (let c = move.startCol; c <= move.endCol; c++) {
      if (!board[r][c].cleared) count++;
    }
  }
  return count;
}

/**
 * Deep clone a board for solver branching.
 */
export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => ({ ...cell })));
}

/**
 * Apply a move in-place (mutates the board). For solver performance.
 */
export function applyMoveMut(board: Board, move: Move): number {
  let cleared = 0;
  for (let r = move.startRow; r <= move.endRow; r++) {
    for (let c = move.startCol; c <= move.endCol; c++) {
      if (!board[r][c].cleared) {
        board[r][c] = { ...board[r][c], cleared: true };
        cleared++;
      }
    }
  }
  return cleared;
}
