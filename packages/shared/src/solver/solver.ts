import type { Board, Move } from '../types/board.js';
import type { SolverSolution, SolverOptions } from './types.js';
import { findAllValidMoves, countUncleared, cloneBoard, applyMoveMut } from './enumerate.js';

interface BeamState {
  board: Board;
  moves: Move[];
  cleared: number;
}

/**
 * Greedy solver: always pick the move that clears the most cells.
 * Fast baseline (~100ms for 10x17 board).
 */
export function solveBoardGreedy(board: Board, targetSum: number): SolverSolution {
  const start = Date.now();
  const currentBoard = cloneBoard(board);
  const moves: Move[] = [];
  let totalCleared = 0;

  while (true) {
    const validMoves = findAllValidMoves(currentBoard, targetSum);
    if (validMoves.length === 0) break;

    // Pick the move that clears the most cells
    let bestMove = validMoves[0];
    let bestCount = countUncleared(currentBoard, bestMove);
    for (let i = 1; i < validMoves.length; i++) {
      const count = countUncleared(currentBoard, validMoves[i]);
      if (count > bestCount) {
        bestCount = count;
        bestMove = validMoves[i];
      }
    }

    const cleared = applyMoveMut(currentBoard, bestMove);
    totalCleared += cleared;
    moves.push(bestMove);
  }

  return { moves, totalCleared, solveTimeMs: Date.now() - start };
}

/**
 * Beam search solver: explores multiple paths, keeping top-K states at each depth.
 * Returns the best solution found within the time budget.
 */
export function solveBoardBeam(
  board: Board,
  targetSum: number,
  options: SolverOptions,
  onProgress?: (solution: SolverSolution) => void,
): SolverSolution {
  const start = Date.now();
  const deadline = start + options.timeLimitMs;

  // Start with greedy as floor
  let bestSolution = solveBoardGreedy(board, targetSum);
  if (onProgress) onProgress(bestSolution);

  let beam: BeamState[] = [
    { board: cloneBoard(board), moves: [], cleared: 0 },
  ];

  let iteration = 0;

  while (beam.length > 0) {
    if (Date.now() >= deadline) break;

    const candidates: BeamState[] = [];

    for (const state of beam) {
      if (Date.now() >= deadline) break;

      const validMoves = findAllValidMoves(state.board, targetSum);

      if (validMoves.length === 0) {
        // Terminal state — check if it's the best
        if (state.cleared > bestSolution.totalCleared) {
          bestSolution = {
            moves: state.moves,
            totalCleared: state.cleared,
            solveTimeMs: Date.now() - start,
          };
          if (onProgress) onProgress(bestSolution);
        }
        continue;
      }

      for (const move of validMoves) {
        const newBoard = cloneBoard(state.board);
        const cleared = applyMoveMut(newBoard, move);
        candidates.push({
          board: newBoard,
          moves: [...state.moves, move],
          cleared: state.cleared + cleared,
        });
      }
    }

    if (candidates.length === 0) break;

    // Score candidates: prefer higher cleared count, then more remaining moves as tiebreak
    // For efficiency, only compute remaining moves for top candidates if needed
    candidates.sort((a, b) => b.cleared - a.cleared);

    // Deduplicate by board state hash (cleared cells pattern)
    const seen = new Set<string>();
    const deduped: BeamState[] = [];
    for (const c of candidates) {
      const hash = boardHash(c.board);
      if (!seen.has(hash)) {
        seen.add(hash);
        deduped.push(c);
      }
      if (deduped.length >= options.beamWidth) break;
    }

    beam = deduped;

    // Check best candidate in beam
    for (const state of beam) {
      if (state.cleared > bestSolution.totalCleared) {
        bestSolution = {
          moves: state.moves,
          totalCleared: state.cleared,
          solveTimeMs: Date.now() - start,
        };
        if (onProgress) onProgress(bestSolution);
      }
    }

    iteration++;
    // Report progress periodically
    if (onProgress && iteration % 5 === 0) {
      onProgress(bestSolution);
    }
  }

  bestSolution.solveTimeMs = Date.now() - start;
  return bestSolution;
}

/**
 * Hash a board state by its cleared cell pattern for deduplication.
 */
function boardHash(board: Board): string {
  // Use a compact representation: one bit per cell (cleared or not)
  const parts: string[] = [];
  for (const row of board) {
    let bits = 0;
    let bitCount = 0;
    for (const cell of row) {
      bits = (bits << 1) | (cell.cleared ? 1 : 0);
      bitCount++;
      if (bitCount === 30) {
        parts.push(bits.toString(36));
        bits = 0;
        bitCount = 0;
      }
    }
    if (bitCount > 0) {
      parts.push(bits.toString(36));
    }
  }
  return parts.join('.');
}
