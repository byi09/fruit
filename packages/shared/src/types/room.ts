import type { PlayerState } from './player.js';
import type { StandingEntry } from './events.js';

export enum RoomStatus {
  LOBBY = 'lobby',
  COUNTDOWN = 'countdown',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface GameConfig {
  rows: number;
  cols: number;
  durationMs: number;
  countdownMs: number;
  targetSum: number;
}

export interface RoundResult {
  roundNumber: number;
  standings: StandingEntry[];
}

export interface RoomState {
  id: string;
  code: string;
  hostPlayerId: string;
  players: Record<string, PlayerState>;
  status: RoomStatus;
  seed: number;
  config: GameConfig;
  createdAt: number;
  roundNumber: number;
  roundHistory: RoundResult[];
  countdownStartedAt?: number;
  gameStartedAt?: number;
  gameEndsAt?: number;
}
