import { io, type Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '@fruitbox/shared';

export type TypedSocket = Socket<ServerEvents, ClientEvents>;

const URL = import.meta.env.DEV ? 'http://localhost:3000' : '';

export const socket: TypedSocket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
