import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { RoomStatus } from '@fruitbox/shared';
import { RoomManager } from '../src/rooms/RoomManager';
import { GameController } from '../src/game/GameController';

describe('GameController', () => {
  let io: Server;
  let rm: RoomManager;
  let gc: GameController;

  beforeEach(() => {
    vi.useFakeTimers();
    const httpServer = createServer();
    io = new Server(httpServer);
    rm = new RoomManager();
    gc = new GameController(io as any, rm);
  });

  afterEach(() => {
    vi.useRealTimers();
    io.close();
  });

  describe('startGame', () => {
    it('transitions room to COUNTDOWN', () => {
      const { room } = rm.createRoom('Alice', 's1');
      rm.joinRoom(room.code, 'Bob', 's2');
      const result = gc.startGame(room.code);
      expect(result.ok).toBe(true);
      expect(room.status).toBe(RoomStatus.COUNTDOWN);
      expect(room.seed).toBeGreaterThan(0);
    });

    it('rejects if not in LOBBY', () => {
      const { room } = rm.createRoom('Alice', 's1');
      room.status = RoomStatus.PLAYING;
      expect(gc.startGame(room.code).ok).toBe(false);
    });

    it('allows starting with 1 player (solo mode)', () => {
      const { room } = rm.createRoom('Alice', 's1');
      expect(gc.startGame(room.code).ok).toBe(true);
    });

    it('transitions to PLAYING after countdown', () => {
      const { room } = rm.createRoom('Alice', 's1');
      gc.startGame(room.code);
      vi.advanceTimersByTime(room.config.countdownMs);
      expect(room.status).toBe(RoomStatus.PLAYING);
      expect(room.gameStartedAt).toBeDefined();
      expect(room.gameEndsAt).toBeDefined();
    });

    it('transitions to FINISHED after game duration', () => {
      const { room } = rm.createRoom('Alice', 's1');
      gc.startGame(room.code);
      vi.advanceTimersByTime(room.config.countdownMs);
      vi.advanceTimersByTime(room.config.durationMs);
      expect(room.status).toBe(RoomStatus.FINISHED);
    });
  });

  describe('processMove', () => {
    it('validates and applies a valid move', () => {
      const { room, player } = rm.createRoom('Alice', 's1');
      gc.startGame(room.code);
      vi.advanceTimersByTime(room.config.countdownMs);

      // We need to find a valid move on the generated board
      const board = gc.getPlayerBoard(room.code, player.id)!;
      const boardData = board.getBoard();

      // Find a single cell or small rectangle that sums to target
      let validMove = null;
      for (let r = 0; r < boardData.length && !validMove; r++) {
        for (let c = 0; c < boardData[0].length && !validMove; c++) {
          // Try single cell
          if (boardData[r][c].value === room.config.targetSum) {
            validMove = { startRow: r, startCol: c, endRow: r, endCol: c };
          }
          // Try two adjacent cells in a row
          if (c + 1 < boardData[0].length) {
            const sum = boardData[r][c].value + boardData[r][c + 1].value;
            if (sum === room.config.targetSum) {
              validMove = { startRow: r, startCol: c, endRow: r, endCol: c + 1 };
            }
          }
        }
      }

      if (validMove) {
        const result = gc.processMove(room.code, player.id, validMove);
        expect(result.valid).toBe(true);
        expect(result.cellsCleared).toBeGreaterThan(0);
        expect(room.players[player.id].score).toBe(result.cellsCleared);
        expect(room.players[player.id].movesMade).toBe(1);
      }
    });

    it('rejects invalid move', () => {
      const { room, player } = rm.createRoom('Alice', 's1');
      gc.startGame(room.code);
      vi.advanceTimersByTime(room.config.countdownMs);

      // Select entire board — sum will be >> 10
      const result = gc.processMove(room.code, player.id, {
        startRow: 0,
        startCol: 0,
        endRow: 9,
        endCol: 16,
      });
      expect(result.valid).toBe(false);
    });

    it('rejects move when game is not playing', () => {
      const { room, player } = rm.createRoom('Alice', 's1');
      const result = gc.processMove(room.code, player.id, {
        startRow: 0,
        startCol: 0,
        endRow: 0,
        endCol: 0,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('handleRematch', () => {
    it('resets room for rematch', () => {
      const { room } = rm.createRoom('Alice', 's1');
      gc.startGame(room.code);
      vi.advanceTimersByTime(room.config.countdownMs + room.config.durationMs);
      expect(room.status).toBe(RoomStatus.FINISHED);

      const result = gc.handleRematch(room.code);
      expect(result.ok).toBe(true);
      expect(room.status).toBe(RoomStatus.LOBBY);
    });

    it('rejects rematch if not finished', () => {
      const { room } = rm.createRoom('Alice', 's1');
      const result = gc.handleRematch(room.code);
      expect(result.ok).toBe(false);
    });
  });
});
