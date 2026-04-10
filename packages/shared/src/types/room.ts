import type { PlayerState } from './player.js';

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

export interface RoomState {
  id: string;
  code: string;
  hostPlayerId: string;
  players: Record<string, PlayerState>;
  status: RoomStatus;
  seed: number;
  config: GameConfig;
  createdAt: number;
  countdownStartedAt?: number;
  gameStartedAt?: number;
  gameEndsAt?: number;
}
