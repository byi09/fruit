import { v4 as uuidv4 } from 'uuid';
import {
  type RoomState,
  type PlayerState,
  type GameConfig,
  RoomStatus,
  GRID_ROWS,
  GRID_COLS,
  GAME_DURATION_MS,
  COUNTDOWN_MS,
  TARGET_SUM,
  MAX_PLAYERS_PER_ROOM,
  ROOM_CLEANUP_MS,
} from '@fruitbox/shared';
import { generateRoomCode } from './RoomCodeGenerator.js';

const DEFAULT_CONFIG: GameConfig = {
  rows: GRID_ROWS,
  cols: GRID_COLS,
  durationMs: GAME_DURATION_MS,
  countdownMs: COUNTDOWN_MS,
  targetSum: TARGET_SUM,
};

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

  createRoom(playerName: string, socketId: string): { room: RoomState; player: PlayerState } {
    const existingCodes = new Set(this.rooms.keys());
    const code = generateRoomCode(existingCodes);
    const playerId = uuidv4();

    const player: PlayerState = {
      id: playerId,
      name: playerName,
      socketId,
      connected: true,
      score: 0,
      movesMade: 0,
    };

    const room: RoomState = {
      id: uuidv4(),
      code,
      hostPlayerId: playerId,
      players: { [playerId]: player },
      status: RoomStatus.LOBBY,
      seed: 0,
      config: { ...DEFAULT_CONFIG },
      createdAt: Date.now(),
      roundNumber: 1,
      roundHistory: [],
    };

    this.rooms.set(code, room);
    this.scheduleCleanup(code);
    return { room, player };
  }

  joinRoom(
    roomCode: string,
    playerName: string,
    socketId: string,
  ): { room: RoomState; player: PlayerState } | { error: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };

    // Auto-assign spectator role when joining during an in-progress game.
    // Spectators stay spectators until the match ends, then become players.
    const midGame =
      room.status === RoomStatus.COUNTDOWN ||
      room.status === RoomStatus.PLAYING ||
      room.status === RoomStatus.PAUSED;

    if (room.status === RoomStatus.FINISHED) {
      return { error: 'Game has ended — wait for the host to start a rematch' };
    }

    if (Object.keys(room.players).length >= MAX_PLAYERS_PER_ROOM) {
      return { error: 'Room is full' };
    }

    const playerId = uuidv4();
    const player: PlayerState = {
      id: playerId,
      name: playerName,
      socketId,
      connected: true,
      score: 0,
      movesMade: 0,
      isSpectator: midGame || undefined,
    };

    room.players[playerId] = player;
    this.touchCleanup(roomCode);
    return { room, player };
  }

  getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code);
  }

  getRoomByPlayerId(playerId: string): RoomState | undefined {
    for (const room of this.rooms.values()) {
      if (room.players[playerId]) return room;
    }
    return undefined;
  }

  removePlayer(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    delete room.players[playerId];

    if (Object.keys(room.players).length === 0) {
      this.deleteRoom(roomCode);
      return;
    }

    // Promote new host if the host left (never promote a spectator)
    if (room.hostPlayerId === playerId) {
      const activePlayers = Object.values(room.players).filter((p) => !p.isSpectator);
      const connectedActive = activePlayers.filter((p) => p.connected);
      const newHost = connectedActive[0] || activePlayers[0];
      if (newHost) {
        room.hostPlayerId = newHost.id;
      }
    }
  }

  markDisconnected(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room || !room.players[playerId]) return;
    room.players[playerId].connected = false;
    room.players[playerId].socketId = null;
    room.players[playerId].disconnectedAt = Date.now();
  }

  markReconnected(roomCode: string, playerId: string, socketId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room || !room.players[playerId]) return;
    room.players[playerId].connected = true;
    room.players[playerId].socketId = socketId;
    room.players[playerId].disconnectedAt = undefined;
  }

  promoteHost(roomCode: string): string | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const connectedActive = Object.values(room.players).filter((p) => p.connected && !p.isSpectator);
    if (connectedActive.length === 0) return null;

    room.hostPlayerId = connectedActive[0].id;
    return connectedActive[0].id;
  }

  resetForRematch(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.status = RoomStatus.LOBBY;
    room.seed = 0;
    room.roundNumber += 1;
    room.countdownStartedAt = undefined;
    room.gameStartedAt = undefined;
    room.gameEndsAt = undefined;

    for (const player of Object.values(room.players)) {
      player.score = 0;
      player.movesMade = 0;
      player.lastMoveAt = undefined;
    }
  }

  deleteRoom(code: string): void {
    this.rooms.delete(code);
    const timer = this.cleanupTimers.get(code);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(code);
    }
  }

  private scheduleCleanup(code: string): void {
    const timer = setTimeout(() => {
      const room = this.rooms.get(code);
      if (room) {
        const allDisconnected = Object.values(room.players).every((p) => !p.connected);
        if (allDisconnected || room.status === RoomStatus.FINISHED) {
          this.deleteRoom(code);
        } else {
          this.scheduleCleanup(code);
        }
      }
    }, ROOM_CLEANUP_MS);
    this.cleanupTimers.set(code, timer);
  }

  private touchCleanup(code: string): void {
    const timer = this.cleanupTimers.get(code);
    if (timer) clearTimeout(timer);
    this.scheduleCleanup(code);
  }

  getAllRoomCodes(): string[] {
    return Array.from(this.rooms.keys());
  }
}
