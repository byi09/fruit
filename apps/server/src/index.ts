import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ClientEvents, ServerEvents } from '@fruitbox/shared';
import { config } from './config.js';
import { RoomManager } from './rooms/RoomManager.js';
import { GameController } from './game/GameController.js';
import { SessionStore } from './socket/sessionStore.js';
import { registerHandlers } from './socket/registerHandlers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server<ClientEvents, ServerEvents>(httpServer, {
    cors:
      config.nodeEnv === 'development'
        ? { origin: '*', methods: ['GET', 'POST'] }
        : undefined,
    pingTimeout: 10_000,
    pingInterval: 5_000,
  });

  const roomManager = new RoomManager();
  const gameController = new GameController(io, roomManager);
  const sessionStore = new SessionStore();

  io.on('connection', (socket) => {
    registerHandlers(io, socket, roomManager, gameController, sessionStore);
  });

  // In production, serve the client build
  if (config.nodeEnv === 'production') {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  return { app, httpServer, io, roomManager, gameController, sessionStore };
}

// Start server if run directly
const { httpServer } = createApp();
httpServer.listen(config.port, () => {
  console.log(`Fruit Box server running on port ${config.port}`);
});
