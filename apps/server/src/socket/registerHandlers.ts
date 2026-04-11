import type { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { RoomStatus, RECONNECT_GRACE_MS } from '@fruitbox/shared';
import type { ClientEvents, ServerEvents } from '@fruitbox/shared';
import type { RoomManager } from '../rooms/RoomManager.js';
import type { GameController } from '../game/GameController.js';
import type { SessionStore } from './sessionStore.js';

type TypedSocket = Socket<ClientEvents, ServerEvents>;
type TypedServer = Server<ClientEvents, ServerEvents>;

// Track socket -> player mapping for disconnect handling
const socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function registerHandlers(
  io: TypedServer,
  socket: TypedSocket,
  roomManager: RoomManager,
  gameController: GameController,
  sessionStore: SessionStore,
): void {
  // --- Room: Create ---
  socket.on('room:create', (payload, ack) => {
    const { playerName } = payload;
    if (!playerName || playerName.trim().length === 0) {
      return ack({ ok: false, error: 'Player name is required' });
    }

    const { room, player } = roomManager.createRoom(playerName.trim(), socket.id);
    const sessionToken = uuidv4();
    sessionStore.set(sessionToken, { roomCode: room.code, playerId: player.id });
    socketToPlayer.set(socket.id, { roomCode: room.code, playerId: player.id });

    socket.join(room.code);
    ack({ ok: true, roomCode: room.code, playerId: player.id, sessionToken, roomState: room });
  });

  // --- Room: Join ---
  socket.on('room:join', (payload, ack) => {
    const { roomCode, playerName } = payload;
    if (!playerName || playerName.trim().length === 0) {
      return ack({ ok: false, error: 'Player name is required' });
    }
    if (!roomCode) {
      return ack({ ok: false, error: 'Room code is required' });
    }

    const result = roomManager.joinRoom(roomCode.toUpperCase(), playerName.trim(), socket.id);
    if ('error' in result) {
      return ack({ ok: false, error: result.error });
    }

    const { room, player } = result;
    const sessionToken = uuidv4();
    sessionStore.set(sessionToken, { roomCode: room.code, playerId: player.id });
    socketToPlayer.set(socket.id, { roomCode: room.code, playerId: player.id });

    socket.join(room.code);

    // Notify others
    socket.to(room.code).emit('room:player_joined', player);

    ack({ ok: true, playerId: player.id, sessionToken, roomState: room });
  });

  // --- Room: Reconnect ---
  socket.on('room:reconnect', (payload, ack) => {
    const { sessionToken } = payload;
    const session = sessionStore.get(sessionToken);
    if (!session) {
      return ack({ ok: false, error: 'Invalid session' });
    }

    const { roomCode, playerId } = session;
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.players[playerId]) {
      sessionStore.delete(sessionToken);
      return ack({ ok: false, error: 'Room no longer exists' });
    }

    // Cancel disconnect timer
    const timerKey = `${roomCode}:${playerId}`;
    const timer = disconnectTimers.get(timerKey);
    if (timer) {
      clearTimeout(timer);
      disconnectTimers.delete(timerKey);
    }

    // Rebind socket
    roomManager.markReconnected(roomCode, playerId, socket.id);
    socketToPlayer.set(socket.id, { roomCode, playerId });
    socket.join(roomCode);

    // Get board if game is in progress
    const playerBoard = gameController.getPlayerBoard(roomCode, playerId);
    const board = playerBoard?.getBoard();

    // Notify others
    socket.to(roomCode).emit('room:player_reconnected', { playerId });

    ack({ ok: true, playerId, roomState: room, board });
  });

  // --- Room: Leave ---
  socket.on('room:leave', () => {
    handlePlayerLeave(socket, roomManager, gameController, sessionStore, io);
  });

  // --- Game: Start ---
  socket.on('game:start', (ack) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return ack({ ok: false, error: 'Not in a room' });

    const room = roomManager.getRoom(mapping.roomCode);
    if (!room) return ack({ ok: false, error: 'Room not found' });
    if (room.hostPlayerId !== mapping.playerId) return ack({ ok: false, error: 'Only host can start' });

    const result = gameController.startGame(mapping.roomCode);
    ack(result);
  });

  // --- Game: Move ---
  socket.on('game:move', (payload, ack) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return ack({ valid: false, cellsCleared: 0, reason: 'sum_not_target' });

    const result = gameController.processMove(mapping.roomCode, mapping.playerId, payload);
    ack(result);
  });

  // --- Game: Rematch ---
  socket.on('game:rematch', (ack) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return ack({ ok: false, error: 'Not in a room' });

    const room = roomManager.getRoom(mapping.roomCode);
    if (!room) return ack({ ok: false, error: 'Room not found' });
    if (room.hostPlayerId !== mapping.playerId) return ack({ ok: false, error: 'Only host can start rematch' });

    const result = gameController.handleRematch(mapping.roomCode);
    ack(result);
  });

  // --- Game: Pause ---
  socket.on('game:pause', (ack) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return ack({ ok: false, error: 'Not in a room' });

    const result = gameController.pauseGame(mapping.roomCode, mapping.playerId);
    ack(result);
  });

  // --- Game: Resume ---
  socket.on('game:resume', (ack) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return ack({ ok: false, error: 'Not in a room' });

    const result = gameController.resumeGame(mapping.roomCode, mapping.playerId);
    ack(result);
  });

  // --- Time Sync ---
  socket.on('time:sync', (payload, ack) => {
    ack({ clientSendTime: payload.clientSendTime, serverTime: Date.now() });
  });

  // --- Chat ---
  socket.on('chat:send', (payload) => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;

    const room = roomManager.getRoom(mapping.roomCode);
    if (!room) return;

    const player = room.players[mapping.playerId];
    if (!player) return;

    const message = payload.message.trim().slice(0, 200);
    if (!message) return;

    io.to(mapping.roomCode).emit('chat:message', {
      playerId: mapping.playerId,
      playerName: player.name,
      message,
      timestamp: Date.now(),
    });
  });

  // --- Disconnect ---
  socket.on('disconnect', () => {
    const mapping = socketToPlayer.get(socket.id);
    if (!mapping) return;

    const { roomCode, playerId } = mapping;
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.players[playerId]) return;

    socketToPlayer.delete(socket.id);
    roomManager.markDisconnected(roomCode, playerId);

    // Notify others
    io.to(roomCode).emit('room:player_disconnected', { playerId });

    // If host disconnected, promote someone else
    if (room.hostPlayerId === playerId) {
      const newHostId = roomManager.promoteHost(roomCode);
      if (newHostId) {
        io.to(roomCode).emit('room:host_changed', { playerId: newHostId });
      }
    }

    // Start grace period
    const timerKey = `${roomCode}:${playerId}`;
    const graceTimer = setTimeout(() => {
      disconnectTimers.delete(timerKey);
      const currentRoom = roomManager.getRoom(roomCode);
      if (!currentRoom) return;

      const player = currentRoom.players[playerId];
      if (player && !player.connected) {
        if (currentRoom.status === RoomStatus.LOBBY) {
          roomManager.removePlayer(roomCode, playerId);
          io.to(roomCode).emit('room:player_left', { playerId });

          // Clean up session
          const session = sessionStore.findByPlayerId(playerId);
          if (session) sessionStore.delete(session.token);

          // Check if host needs promotion
          if (currentRoom.hostPlayerId === playerId) {
            const newHostId = roomManager.promoteHost(roomCode);
            if (newHostId) {
              io.to(roomCode).emit('room:host_changed', { playerId: newHostId });
            }
          }
        }
        // During PLAYING: player stays but is marked disconnected
        gameController.checkAllDisconnected(roomCode);
      }
    }, RECONNECT_GRACE_MS);
    disconnectTimers.set(timerKey, graceTimer);
  });
}

function handlePlayerLeave(
  socket: TypedSocket,
  roomManager: RoomManager,
  gameController: GameController,
  sessionStore: SessionStore,
  io: TypedServer,
): void {
  const mapping = socketToPlayer.get(socket.id);
  if (!mapping) return;

  const { roomCode, playerId } = mapping;
  socketToPlayer.delete(socket.id);
  socket.leave(roomCode);

  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const wasHost = room.hostPlayerId === playerId;
  roomManager.removePlayer(roomCode, playerId);

  // Clean up session
  const session = sessionStore.findByPlayerId(playerId);
  if (session) sessionStore.delete(session.token);

  io.to(roomCode).emit('room:player_left', { playerId });

  if (wasHost) {
    const newHostId = roomManager.promoteHost(roomCode);
    if (newHostId) {
      io.to(roomCode).emit('room:host_changed', { playerId: newHostId });
    }
  }

  gameController.checkAllDisconnected(roomCode);
}
