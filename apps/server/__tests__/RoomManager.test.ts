import { describe, it, expect, beforeEach } from 'vitest';
import { RoomStatus } from '@fruitbox/shared';
import { RoomManager } from '../src/rooms/RoomManager';

describe('RoomManager', () => {
  let rm: RoomManager;

  beforeEach(() => {
    rm = new RoomManager();
  });

  describe('createRoom', () => {
    it('creates a room with a host player', () => {
      const { room, player } = rm.createRoom('Alice', 'socket-1');
      expect(room.code).toHaveLength(4);
      expect(room.status).toBe(RoomStatus.LOBBY);
      expect(room.hostPlayerId).toBe(player.id);
      expect(room.players[player.id]).toBeDefined();
      expect(room.players[player.id].name).toBe('Alice');
      expect(room.players[player.id].connected).toBe(true);
    });

    it('generates unique room codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const { room } = rm.createRoom(`P${i}`, `s${i}`);
        codes.add(room.code);
      }
      expect(codes.size).toBe(50);
    });
  });

  describe('joinRoom', () => {
    it('allows joining an existing lobby room', () => {
      const { room } = rm.createRoom('Alice', 's1');
      const result = rm.joinRoom(room.code, 'Bob', 's2');
      expect('error' in result).toBe(false);
      if (!('error' in result)) {
        expect(result.player.name).toBe('Bob');
        expect(Object.keys(result.room.players)).toHaveLength(2);
      }
    });

    it('rejects joining nonexistent room', () => {
      const result = rm.joinRoom('ZZZZ', 'Bob', 's2');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Room not found');
      }
    });

    it('rejects joining room not in lobby', () => {
      const { room } = rm.createRoom('Alice', 's1');
      room.status = RoomStatus.PLAYING;
      const result = rm.joinRoom(room.code, 'Bob', 's2');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Game already in progress');
      }
    });
  });

  describe('removePlayer', () => {
    it('removes a player from the room', () => {
      const { room, player: alice } = rm.createRoom('Alice', 's1');
      const result = rm.joinRoom(room.code, 'Bob', 's2');
      if (!('error' in result)) {
        rm.removePlayer(room.code, result.player.id);
        expect(Object.keys(room.players)).toHaveLength(1);
        expect(room.players[alice.id]).toBeDefined();
      }
    });

    it('promotes new host when host is removed', () => {
      const { room, player: alice } = rm.createRoom('Alice', 's1');
      const result = rm.joinRoom(room.code, 'Bob', 's2');
      if (!('error' in result)) {
        rm.removePlayer(room.code, alice.id);
        expect(room.hostPlayerId).toBe(result.player.id);
      }
    });

    it('deletes room when last player leaves', () => {
      const { room, player } = rm.createRoom('Alice', 's1');
      rm.removePlayer(room.code, player.id);
      expect(rm.getRoom(room.code)).toBeUndefined();
    });
  });

  describe('disconnect/reconnect', () => {
    it('marks player as disconnected', () => {
      const { room, player } = rm.createRoom('Alice', 's1');
      rm.markDisconnected(room.code, player.id);
      expect(room.players[player.id].connected).toBe(false);
      expect(room.players[player.id].socketId).toBeNull();
    });

    it('marks player as reconnected', () => {
      const { room, player } = rm.createRoom('Alice', 's1');
      rm.markDisconnected(room.code, player.id);
      rm.markReconnected(room.code, player.id, 'new-socket');
      expect(room.players[player.id].connected).toBe(true);
      expect(room.players[player.id].socketId).toBe('new-socket');
    });
  });

  describe('resetForRematch', () => {
    it('resets room and player scores', () => {
      const { room, player } = rm.createRoom('Alice', 's1');
      room.status = RoomStatus.FINISHED;
      room.players[player.id].score = 42;
      room.players[player.id].movesMade = 10;

      rm.resetForRematch(room.code);

      expect(room.status).toBe(RoomStatus.LOBBY);
      expect(room.players[player.id].score).toBe(0);
      expect(room.players[player.id].movesMade).toBe(0);
      expect(room.seed).toBe(0);
    });
  });
});
