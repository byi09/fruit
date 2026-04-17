// Types
export type { Cell, Board, Move, MoveResult } from './types/board.js';
export type { PlayerState } from './types/player.js';
export type { RoomState, GameConfig, RoundResult } from './types/room.js';
export { RoomStatus } from './types/room.js';
export type { ClientEvents, ServerEvents, StandingEntry } from './types/events.js';

// Constants
export * from './constants.js';

// Board engine
export { mulberry32 } from './board/prng.js';
export { generateBoard } from './board/generate.js';
export { validateMove, applyMove, normalizeMove, getRectangleSum } from './board/validate.js';

// Scoring
export { compareStandings, computeStandings } from './scoring.js';

// Solver
export type { SolverSolution, SolverOptions } from './solver/types.js';
export { findAllValidMoves, countUncleared, cloneBoard, applyMoveMut } from './solver/enumerate.js';
export { solveBoardGreedy, solveBoardBeam } from './solver/solver.js';
