# Fruit Box — Multiplayer

A real-time multiplayer competitive puzzle game. Players select rectangles of numbered apples that sum to 10. All players receive the same board and compete independently under a synchronized timer.

## Quick Start

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies WebSocket connections to the backend on port 3000.

## Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + npm workspaces |
| Client | React 18, Vite, Tailwind CSS, TypeScript |
| Server | Express, Socket.IO, TypeScript |
| Shared | @fruitbox/shared (types, game engine, scoring) |
| Testing | Vitest |

## Project Structure

```
packages/shared/    — Types, constants, board generation, validation, scoring
apps/server/        — Express + Socket.IO server
apps/client/        — React + Vite client
docs/               — Architecture, testing strategy
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client (5173) and server (3000) in dev mode |
| `npm run build` | Build all packages |
| `npm run test` | Run all tests |
| `npm run test:shared` | Run shared package tests |
| `npm run test:server` | Run server tests |

## How to Play

1. **Create a room** — Enter your name and click "Create Room"
2. **Share the code** — Give the 4-letter room code to friends
3. **Start the game** — Host clicks "Start Game"
4. **Select rectangles** — Drag to select apples that sum to exactly 10
5. **Clear apples** — Valid selections clear those apples from your board
6. **Compete** — Clear the most apples before time runs out!

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |

## Game Rules

- Board is a 10x17 grid of numbered apples (1-9)
- Drag to select a rectangular region
- If the sum of uncleared numbers in the rectangle equals exactly 10, those cells are cleared
- Cleared cells stay empty (no gravity)
- Match lasts 2 minutes
- Player with the most apples cleared wins
- Tie-break: fewer moves → earlier last move

## Engineering Decisions

### Why this stack?
- **Turborepo monorepo**: Shared types between client/server without duplication
- **Socket.IO**: Built-in rooms, reconnection, acknowledgement patterns
- **Vite + React**: Fast HMR, simple static build, no SSR needed for a game
- **Tailwind**: Rapid responsive UI development

### How synchronization works
- Server generates a random seed and authoritative timestamps
- All clients generate their board from the same seed using a deterministic PRNG (mulberry32)
- Each player's board evolves independently from their moves
- Server maintains shadow boards for validation

### How board fairness is ensured
- Same seed → identical board for all players (verified by determinism tests)
- Server-authoritative game start/end times eliminate timing advantages
- No information about other players' boards is revealed during play

### How cheating is reduced (MVP)
- Server validates every move against its shadow board
- Server is the authority for final scores
- Clients can't inflate scores without submitting valid moves

### How reconnect works
- Session token stored in `sessionStorage`
- 30-second grace period on disconnect
- Full state + board restored on reconnect

### What remains MVP-only
- In-memory storage (no persistence across server restarts)
- No player authentication (name-based only)
- No spectator mode
- No match history
- No rate limiting on move submissions
- Bot detection not implemented

## Deployment

The server can serve the client's static build in production:

```bash
npm run build
NODE_ENV=production node apps/server/dist/index.js
```

Works on any Node.js 18+ host (Railway, Render, Fly.io, etc.). Single process, single port.

## License

MIT
