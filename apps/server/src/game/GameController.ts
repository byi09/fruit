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

    const connectedPlayers = Object.values(room.players).filter((p) => p.connected && !p.isSpectator);
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

    // Create shadow boards for active players only (spectators have no board)
    const boards = new Map<string, PlayerBoard>();
    for (const [playerId, player] of Object.entries(room.players)) {
      if (player.isSpectator) continue;
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

  pauseGame(roomCode: string, playerId: string): { ok: boolean; error?: string } {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.status !== RoomStatus.PLAYING) return { ok: false, error: 'Game is not playing' };

    const player = room.players[playerId];
    if (!player) return { ok: false, error: 'Player not found' };

    room.pausedAt = Date.now();
    room.remainingMs = Math.max(0, (room.gameEndsAt ?? 0) - room.pausedAt);
    room.pausedBy = playerId;
    room.status = RoomStatus.PAUSED;

    const gameTimer = this.gameTimers.get(roomCode);
    if (gameTimer) {
      clearTimeout(gameTimer);
      this.gameTimers.delete(roomCode);
    }

    this.io.to(roomCode).emit('game:paused', { pausedBy: playerId, playerName: player.name });
    return { ok: true };
  }

  resumeGame(roomCode: string, playerId: string): { ok: boolean; error?: string } {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.status !== RoomStatus.PAUSED) return { ok: false, error: 'Game is not paused' };

    const player = room.players[playerId];
    if (!player) return { ok: false, error: 'Player not found' };

    const remaining = room.remainingMs ?? 0;
    room.gameEndsAt = Date.now() + remaining;
    room.status = RoomStatus.PLAYING;
    room.pausedAt = undefined;
    room.remainingMs = undefined;
    room.pausedBy = undefined;

    const gameTimer = setTimeout(() => {
      this.endGame(roomCode);
    }, remaining);
    this.gameTimers.set(roomCode, gameTimer);

    this.io.to(roomCode).emit('game:resumed', { endsAt: room.gameEndsAt });
    return { ok: true };
  }

  processMove(roomCode: string, playerId: string, move: Move): MoveResult {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || room.status !== RoomStatus.PLAYING) {
      return { valid: false, cellsCleared: 0, reason: 'sum_not_target' };
    }

    // Spectators cannot make moves
    if (room.players[playerId]?.isSpectator) {
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

        // Broadcast the post-move board snapshot so spectators can render it.
        this.io.to(roomCode).emit('game:board_update', {
          playerId,
          board: playerBoard.getBoard(),
          lastMove: move,
        });
      }
    }

    return result;
  }

  endGame(roomCode: string): void {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || room.status === RoomStatus.FINISHED) return;

    room.status = RoomStatus.FINISHED;

    // Compute final standings (spectators are excluded here before we promote
    // them — they didn't play this round so they shouldn't appear in it).
    const standings = computeStandings(room.players);

    // Archive this round's results
    room.roundHistory.push({
      roundNumber: room.roundNumber,
      standings,
    });

    // Promote spectators into players now that the match has ended so they
    // participate in any rematch.
    let promoted = false;
    for (const p of Object.values(room.players)) {
      if (p.isSpectator) {
        p.isSpectator = undefined;
        promoted = true;
      }
    }

    // Broadcast results with history
    this.io.to(roomCode).emit('game:finished', {
      standings,
      roundNumber: room.roundNumber,
      roundHistory: room.roundHistory,
    });

    // Sync the updated roster so clients pick up the spectator→player change.
    if (promoted) {
      this.io.to(roomCode).emit('room:state', room);
    }

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

    const activePlayers = Object.values(room.players).filter((p) => !p.isSpectator);
    const allDisconnected =
      activePlayers.length > 0 && activePlayers.every((p) => !p.connected);
    if (allDisconnected && room.status === RoomStatus.PLAYING) {
      this.endGame(roomCode);
    }
  }
}
