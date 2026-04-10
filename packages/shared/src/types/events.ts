import type { Board, Move, MoveResult } from './board.js';
import type { GameConfig, RoomState } from './room.js';
import type { PlayerState } from './player.js';

export interface StandingEntry {
  playerId: string;
  playerName: string;
  score: number;
  movesMade: number;
  lastMoveAt: number;
  rank: number;
}

// Client -> Server events
export interface ClientEvents {
  'room:create': (
    payload: { playerName: string },
    ack: (res: { ok: true; roomCode: string; playerId: string; sessionToken: string; roomState: RoomState } | { ok: false; error: string }) => void,
  ) => void;

  'room:join': (
    payload: { roomCode: string; playerName: string },
    ack: (res: { ok: true; playerId: string; sessionToken: string; roomState: RoomState } | { ok: false; error: string }) => void,
  ) => void;

  'room:reconnect': (
    payload: { sessionToken: string },
    ack: (res: { ok: true; playerId: string; roomState: RoomState; board?: Board } | { ok: false; error: string }) => void,
  ) => void;

  'room:leave': () => void;

  'game:start': (
    ack: (res: { ok: boolean; error?: string }) => void,
  ) => void;

  'game:move': (
    payload: Move,
    ack: (res: MoveResult) => void,
  ) => void;

  'game:rematch': (
    ack: (res: { ok: boolean; error?: string }) => void,
  ) => void;
}

// Server -> Client events
export interface ServerEvents {
  'room:state': (state: RoomState) => void;
  'room:player_joined': (player: PlayerState) => void;
  'room:player_left': (payload: { playerId: string }) => void;
  'room:player_disconnected': (payload: { playerId: string }) => void;
  'room:player_reconnected': (payload: { playerId: string }) => void;
  'room:host_changed': (payload: { playerId: string }) => void;

  'game:countdown': (payload: { startsAt: number }) => void;
  'game:started': (payload: { seed: number; endsAt: number; config: GameConfig }) => void;
  'game:score_update': (payload: { playerId: string; score: number; movesMade: number }) => void;
  'game:finished': (payload: { standings: StandingEntry[] }) => void;
  'game:rematch_starting': (payload: { seed: number; startsAt: number }) => void;

  'error': (payload: { message: string }) => void;
}
