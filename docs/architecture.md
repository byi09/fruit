# Architecture

## Overview

Fruit Box is a multiplayer competitive puzzle game where players select rectangles of numbered apples that sum to 10. All players in a room receive the same seeded board and compete on independent copies under a synchronized timer.

## Stack

- **Monorepo**: Turborepo + npm workspaces
- **Client**: React 18, Vite, Tailwind CSS, TypeScript
- **Server**: Express, Socket.IO, TypeScript
- **Shared**: `@fruitbox/shared` — types, constants, game engine (PRNG, board gen, validation, scoring)
- **Testing**: Vitest

## Package Architecture

```
packages/shared    ← Pure game logic + types (no runtime deps)
apps/server        ← Socket.IO server, room management, game orchestration
apps/client        ← React UI, socket client, interaction hooks
```

The shared package is the foundation. Both client and server import it for:
- Deterministic board generation (same seed → same board)
- Move validation (client for instant feedback, server for authority)
- Scoring/tie-break logic
- Type definitions and constants

## Synchronization Model

1. **Room creation**: Server generates a unique room code. Host creates room.
2. **Join phase**: Players join by code. Server manages the player list.
3. **Game start**: Host triggers start → Server generates seed and countdown timestamps.
4. **Countdown**: Server broadcasts `game:countdown` with `startsAt` timestamp. All clients count down from the same absolute time.
5. **Game play**: Server broadcasts `game:started` with `{ seed, endsAt, config }`. Each client generates its board locally from the seed. Each client plays independently.
6. **Move flow**: Client validates locally (optimistic) → sends move to server → server validates against shadow board → acks → broadcasts score update.
7. **Game end**: Server's timer fires at `endsAt` → computes standings → broadcasts `game:finished`.

## Anti-Cheat Design

**MVP**: Server-side shadow boards.

For each player in a game, the server maintains a `PlayerBoard` instance — a full copy of their board state. When a move arrives:

1. Server validates the move against the shadow board using the same `validateMove()` function
2. If valid: applies the move, updates score, broadcasts score update
3. If invalid: rejects via ack

This prevents:
- Submitting moves to clear cells that are already cleared
- Submitting rectangles that don't actually sum to 10
- Inflating scores without valid moves

**Limitations** (acceptable for MVP):
- Server doesn't detect automated/bot play
- Clock drift could give minor advantages (mitigated by server timestamps)

## Reconnect Design

- On room create/join, server returns a `sessionToken` (UUID)
- Client stores token in `sessionStorage`
- On disconnect: server starts 30-second grace timer
- On reconnect: client sends `room:reconnect` with token → server rebinds socket, cancels grace timer, sends full state
- Grace expiry in lobby: player removed. During game: player stays but can't make moves.

## Room Lifecycle

```
LOBBY → COUNTDOWN → PLAYING → FINISHED → LOBBY (rematch)
```

- Host disconnect: next connected player auto-promoted
- All disconnect during game: game ends early
- Room cleanup: 10 minutes of inactivity

## Data Flow

```
Client                          Server
  │  room:create {name}           │
  ├──────────────────────────────►│ Creates room, returns code + token
  │                                │
  │  game:start                    │
  ├──────────────────────────────►│ Generates seed, starts countdown
  │                                │
  │  game:started {seed, endsAt}   │
  │◄──────────────────────────────┤ Client generates board from seed
  │                                │
  │  game:move {r1,c1,r2,c2}      │
  ├──────────────────────────────►│ Validates against shadow board
  │  ack {valid, cellsCleared}     │
  │◄──────────────────────────────┤
  │                                │
  │  game:score_update             │
  │◄──────────────────────────────┤ Broadcast to all in room
  │                                │
  │  game:finished {standings}     │
  │◄──────────────────────────────┤ Timer expired
```
