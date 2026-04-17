export interface PlayerState {
  id: string;
  name: string;
  socketId: string | null;
  connected: boolean;
  score: number;
  movesMade: number;
  lastMoveAt?: number;
  disconnectedAt?: number;
  isSpectator?: boolean;
}
