import {
  type Board,
  type Move,
  type MoveResult,
  generateBoard,
  validateMove,
  applyMove,
} from '@fruitbox/shared';

/**
 * Server-side shadow board for a single player.
 * Maintains authoritative board state and validates moves.
 */
export class PlayerBoard {
  private board: Board;
  private readonly targetSum: number;

  constructor(seed: number, rows: number, cols: number, targetSum: number) {
    this.board = generateBoard(seed, rows, cols);
    this.targetSum = targetSum;
  }

  processMove(move: Move): MoveResult {
    const result = validateMove(this.board, move, this.targetSum);
    if (result.valid) {
      this.board = applyMove(this.board, move);
    }
    return result;
  }

  getBoard(): Board {
    return this.board;
  }
}
