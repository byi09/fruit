import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import {
  type ClientEvents,
  type ServerEvents,
  type RoomState,
  type Board,
  type StandingEntry,
  RoomStatus,
  generateBoard,
  validateMove,
} from '@fruitbox/shared';
import { RoomManager } from '../../src/rooms/RoomManager';
import { GameController } from '../../src/game/GameController';
import { SessionStore } from '../../src/socket/sessionStore';
import { registerHandlers } from '../../src/socket/registerHandlers';

type TypedClientSocket = ClientSocket<ServerEvents, ClientEvents>;

let httpServer: HttpServer;
let ioServer: Server<ClientEvents, ServerEvents>;
let roomManager: RoomManager;
let gameController: GameController;
let sessionStore: SessionStore;
let port: number;

function createClient(): TypedClientSocket {
  return ioClient(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
  }) as TypedClientSocket;
}

function waitForEvent<T>(socket: TypedClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => {
    (socket as any).once(event, (data: T) => resolve(data));
  });
}

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      httpServer = createServer();
      ioServer = new Server(httpServer, { cors: { origin: '*' } });
      roomManager = new RoomManager();
      gameController = new GameController(ioServer as any, roomManager);
      sessionStore = new SessionStore();

      ioServer.on('connection', (socket) => {
        registerHandlers(ioServer as any, socket as any, roomManager, gameController, sessionStore);
      });

      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    }),
);

afterAll(
  () =>
    new Promise<void>((resolve) => {
      ioServer.close();
      httpServer.close(() => resolve());
    }),
);

describe('Full game integration', () => {
  it('two players can create, join, play, and see results', async () => {
    const alice = createClient();
    const bob = createClient();

    try {
      // Alice creates room
      const createResult = await new Promise<any>((resolve) => {
        alice.emit('room:create', { playerName: 'Alice' }, resolve);
      });
      expect(createResult.ok).toBe(true);
      const roomCode = createResult.roomCode;
      const aliceId = createResult.playerId;

      // Bob joins room
      const bobJoinedPromise = waitForEvent<any>(alice, 'room:player_joined');
      const joinResult = await new Promise<any>((resolve) => {
        bob.emit('room:join', { roomCode, playerName: 'Bob' }, resolve);
      });
      expect(joinResult.ok).toBe(true);
      const bobId = joinResult.playerId;

      // Alice should see Bob join
      const joinedPlayer = await bobJoinedPromise;
      expect(joinedPlayer.name).toBe('Bob');

      // Verify room state
      expect(joinResult.roomState.status).toBe(RoomStatus.LOBBY);
      expect(Object.keys(joinResult.roomState.players)).toHaveLength(2);

      // Alice starts game
      const bobCountdownPromise = waitForEvent<any>(bob, 'game:countdown');
      const startResult = await new Promise<any>((resolve) => {
        alice.emit('game:start', resolve);
      });
      expect(startResult.ok).toBe(true);

      // Bob should get countdown
      const countdownData = await bobCountdownPromise;
      expect(countdownData.startsAt).toBeDefined();

      // Wait for game:started on both
      const aliceStartPromise = waitForEvent<any>(alice, 'game:started');
      const bobStartPromise = waitForEvent<any>(bob, 'game:started');
      const [aliceStart, bobStart] = await Promise.all([aliceStartPromise, bobStartPromise]);

      // Both should receive same seed
      expect(aliceStart.seed).toBe(bobStart.seed);
      expect(aliceStart.endsAt).toBe(bobStart.endsAt);

      // Generate local boards and verify they match
      const aliceBoard = generateBoard(aliceStart.seed, aliceStart.config.rows, aliceStart.config.cols);
      const bobBoard = generateBoard(bobStart.seed, bobStart.config.rows, bobStart.config.cols);
      expect(aliceBoard).toEqual(bobBoard);

      // Find a valid move on the board
      let validMove = null;
      for (let r = 0; r < aliceBoard.length && !validMove; r++) {
        for (let c = 0; c < aliceBoard[0].length && !validMove; c++) {
          // Try pairs
          if (c + 1 < aliceBoard[0].length) {
            const result = validateMove(aliceBoard, { startRow: r, startCol: c, endRow: r, endCol: c + 1 }, 10);
            if (result.valid) {
              validMove = { startRow: r, startCol: c, endRow: r, endCol: c + 1 };
            }
          }
        }
      }

      if (validMove) {
        // Alice makes a move
        const bobScorePromise = waitForEvent<any>(bob, 'game:score_update');
        const moveResult = await new Promise<any>((resolve) => {
          alice.emit('game:move', validMove!, resolve);
        });
        expect(moveResult.valid).toBe(true);
        expect(moveResult.cellsCleared).toBe(2);

        // Bob should see Alice's score update
        const scoreUpdate = await bobScorePromise;
        expect(scoreUpdate.playerId).toBe(aliceId);
        expect(scoreUpdate.score).toBe(2);
        expect(scoreUpdate.movesMade).toBe(1);
      }

      // Wait for game to finish
      const aliceFinishPromise = waitForEvent<{ standings: StandingEntry[] }>(alice, 'game:finished');
      const bobFinishPromise = waitForEvent<{ standings: StandingEntry[] }>(bob, 'game:finished');

      const [aliceFinish, bobFinish] = await Promise.all([aliceFinishPromise, bobFinishPromise]);

      // Both see same standings
      expect(aliceFinish.standings).toEqual(bobFinish.standings);
      expect(aliceFinish.standings.length).toBe(2);
      expect(aliceFinish.standings[0].rank).toBe(1);
      expect(aliceFinish.standings[1].rank).toBe(2);

      // Test rematch
      const bobStatePromise = waitForEvent<RoomState>(bob, 'room:state');
      const rematchResult = await new Promise<any>((resolve) => {
        alice.emit('game:rematch', resolve);
      });
      expect(rematchResult.ok).toBe(true);

      const newRoomState = await bobStatePromise;
      expect(newRoomState.status).toBe(RoomStatus.LOBBY);
    } finally {
      alice.disconnect();
      bob.disconnect();
    }
  }, 150_000); // Long timeout for game duration

  it('rejects join with empty name', async () => {
    const client = createClient();
    try {
      const result = await new Promise<any>((resolve) => {
        client.emit('room:create', { playerName: '' }, resolve);
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe('Player name is required');
    } finally {
      client.disconnect();
    }
  });

  it('rejects join to nonexistent room', async () => {
    const client = createClient();
    try {
      const result = await new Promise<any>((resolve) => {
        client.emit('room:join', { roomCode: 'ZZZZ', playerName: 'Bob' }, resolve);
      });
      expect(result.ok).toBe(false);
    } finally {
      client.disconnect();
    }
  });

  it('only host can start the game', async () => {
    const alice = createClient();
    const bob = createClient();
    try {
      const createResult = await new Promise<any>((resolve) => {
        alice.emit('room:create', { playerName: 'Alice' }, resolve);
      });
      await new Promise<any>((resolve) => {
        bob.emit('room:join', { roomCode: createResult.roomCode, playerName: 'Bob' }, resolve);
      });

      // Bob tries to start (not host)
      const startResult = await new Promise<any>((resolve) => {
        bob.emit('game:start', resolve);
      });
      expect(startResult.ok).toBe(false);
      expect(startResult.error).toBe('Only host can start');
    } finally {
      alice.disconnect();
      bob.disconnect();
    }
  });
});
