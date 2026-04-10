import type { Server } from 'socket.io';
import {
  type RoomState,
  type Move,
  type MoveResult,
  type ServerEvents,
  type ClientEvents,
  RoomStatus,
  computeStandings,
} from '@fruitbox/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import { PlayerBoard } from './PlayerBoard.js';

export class GameController {
  // roomCode -> (playerId -> PlayerBoard)
  private playerBoards = new Map<string, Map<string, PlayerBoard>>();
  private gameTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private countdownTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private io: Server<ClientEvents, ServerEvents>,
    private roomManager: RoomManager,
  ) {}

  startGame(roomCode: string): { ok: boolean; error?: string } {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.status !== RoomStatus.LOBBY) return { ok: false, error: 'Game already in progress' };

    const connectedPlayers = Object.values(room.players).filter((p) => p.connected);
    if (connectedPlayers.length < 1) return { ok: false, error: 'Not enough players' };

    // Generate seed and set countdown
    room.seed = Math.floor(Math.random() * 2147483647) + 1;
    room.status = RoomStatus.COUNTDOWN;
    room.countdownStartedAt = Date.now();

    const startsAt = room.countdownStartedAt + room.config.countdownMs;

    // Broadcast countdown
    this.io.to(roomCode).emit('game:countdown', { startsAt });

    // Schedule actual game start
    const countdownTimer = setTimeout(() => {
      this.beginPlay(roomCode);
    }, room.config.countdownMs);
    this.countdownTimers.set(roomCode, countdownTimer);

    return { ok: true };
  }

  private beginPlay(roomCode: string): void {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || room.status !== RoomStatus.COUNTDOWN) return;

    room.status = RoomStatus.PLAYING;
    room.gameStartedAt = Date.now();
    room.gameEndsAt = room.gameStartedAt + room.config.durationMs;

    // Create shadow boards for all players
    const boards = new Map<string, PlayerBoard>();
    for (const playerId of Object.keys(room.players)) {
      boards.set(
        playerId,
        new PlayerBoard(room.seed, room.config.rows, room.config.cols, room.config.targetSum),
      );
    }
    this.playerBoards.set(roomCode, boards);

    // Broadcast game started
    this.io.to(roomCode).emit('game:started', {
      seed: room.seed,
      endsAt: room.gameEndsAt,
      config: room.config,
    });

    // Schedule game end
    const gameTimer = setTimeout(() => {
      this.endGame(roomCode);
    }, room.config.durationMs);
    this.gameTimers.set(roomCode, gameTimer);
  }

  processMove(roomCode: string, playerId: string, move: Move): MoveResult {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || room.status !== RoomStatus.PLAYING) {
      return { valid: false, cellsCleared: 0, reason: 'sum_not_target' };
    }

    // Check if game time has elapsed (in case timer hasn't fired yet)
    if (room.gameEndsAt && Date.now() > room.gameEndsAt) {
      return { valid: false, cellsCleared: 0, reason: 'sum_not_target' };
    }

    const boards = this.playerBoards.get(roomCode);
    const playerBoard = boards?.get(playerId);
    if (!playerBoard) {
      return { valid: false, cellsCleared: 0, reason: 'sum_not_target' };
    }

    const result = playerBoard.processMove(move);

    if (result.valid) {
      const player = room.players[playerId];
      if (player) {
        player.score += result.cellsCleared;
        player.movesMade += 1;
        player.lastMoveAt = Date.now();

        // Broadcast score update to the room
        this.io.to(roomCode).emit('game:score_update', {
          playerId,
          score: player.score,
          movesMade: player.movesMade,
        });
      }
    }

    return result;
  }

  endGame(roomCode: string): void {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || room.status === RoomStatus.FINISHED) return;

    room.status = RoomStatus.FINISHED;

    // Compute final standings
    const standings = computeStandings(room.players);

    // Broadcast results
    this.io.to(roomCode).emit('game:finished', { standings });

    // Cleanup timers and boards
    this.cleanup(roomCode);
  }

  getPlayerBoard(roomCode: string, playerId: string): PlayerBoard | undefined {
    return this.playerBoards.get(roomCode)?.get(playerId);
  }

  handleRematch(roomCode: string): { ok: boolean; error?: string } {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.status !== RoomStatus.FINISHED) return { ok: false, error: 'Game is not finished' };

    this.roomManager.resetForRematch(roomCode);

    // Broadcast updated room state
    this.io.to(roomCode).emit('room:state', room);

    return { ok: true };
  }

  cleanup(roomCode: string): void {
    const gameTimer = this.gameTimers.get(roomCode);
    if (gameTimer) {
      clearTimeout(gameTimer);
      this.gameTimers.delete(roomCode);
    }
    const countdownTimer = this.countdownTimers.get(roomCode);
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      this.countdownTimers.delete(roomCode);
    }
    this.playerBoards.delete(roomCode);
  }

  checkAllDisconnected(roomCode: string): void {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) return;

    const allDisconnected = Object.values(room.players).every((p) => !p.connected);
    if (allDisconnected && room.status === RoomStatus.PLAYING) {
      this.endGame(roomCode);
    }
  }
}
