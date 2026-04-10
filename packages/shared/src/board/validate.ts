import type { Board, Move, MoveResult } from '../types/board.js';

/**
 * Normalizes a move so start <= end for both row and col.
 * Allows drag in any direction.
 */
export function normalizeMove(move: Move): Move {
  return {
    startRow: Math.min(move.startRow, move.endRow),
    startCol: Math.min(move.startCol, move.endCol),
    endRow: Math.max(move.startRow, move.endRow),
    endCol: Math.max(move.startCol, move.endCol),
  };
}

/**
 * Validates a rectangular selection against the board.
 * Returns whether the move is valid and how many cells it would clear.
 */
export function validateMove(board: Board, move: Move, targetSum: number): MoveResult {
  const { startRow, startCol, endRow, endCol } = normalizeMove(move);
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  if (startRow < 0 || startCol < 0 || endRow >= rows || endCol >= cols) {
    return { valid: false, cellsCleared: 0, reason: 'out_of_bounds' };
  }

  let sum = 0;
  let unclearedCount = 0;

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (!board[r][c].cleared) {
        sum += board[r][c].value;
        unclearedCount++;
      }
    }
  }

  if (unclearedCount === 0) {
    return { valid: false, cellsCleared: 0, reason: 'no_uncleared_cells' };
  }

  if (sum !== targetSum) {
    return { valid: false, cellsCleared: 0, reason: 'sum_not_target' };
  }

  return { valid: true, cellsCleared: unclearedCount };
}

/**
 * Applies a validated move to a board, clearing the cells.
 * Returns a new board (does not mutate the original).
 */
export function applyMove(board: Board, move: Move): Board {
  const { startRow, startCol, endRow, endCol } = normalizeMove(move);
  return board.map((row, r) =>
    row.map((cell, c) => {
      if (r >= startRow && r <= endRow && c >= startCol && c <= endCol && !cell.cleared) {
        return { ...cell, cleared: true };
      }
      return cell;
    }),
  );
}

/**
 * Calculates the sum of uncleared cells in a rectangle.
 */
export function getRectangleSum(board: Board, move: Move): { sum: number; count: number } {
  const { startRow, startCol, endRow, endCol } = normalizeMove(move);
  let sum = 0;
  let count = 0;
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (!board[r][c].cleared) {
        sum += board[r][c].value;
        count++;
      }
    }
  }
  return { sum, count };
}
