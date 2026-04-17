import type { Move } from '../types/board.js';

export interface SolverSolution {
  moves: Move[];
  totalCleared: number;
  solveTimeMs: number;
}

export interface SolverOptions {
  beamWidth: number;
  timeLimitMs: number;
}
