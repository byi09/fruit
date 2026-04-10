# Testing Strategy

## Test Pyramid

### Unit Tests (packages/shared)

The shared package contains all pure game logic and is the most critical code to test:

- **PRNG tests**: Determinism, range, distribution, edge cases (seed=0, negative seeds)
- **Board generation tests**: Correct dimensions, value ranges, determinism across seeds, weighted distribution, playability (valid rectangles exist)
- **Move validation tests**: Sum calculation, boundary checks, cleared cell handling, normalization (drag in any direction), single-cell selection, edge cases
- **Scoring tests**: Tie-break ordering (score → moves → time), single player, zero scores

### Unit Tests (apps/server)

- **RoomManager**: Create/join/leave, host promotion, disconnect/reconnect marking, rematch reset, room cleanup
- **GameController**: State transitions (lobby→countdown→playing→finished), move processing, game timer, rematch flow

### Integration Tests (apps/server)

Full game flow using `socket.io-client`:
- Two clients create/join a room
- Host starts game
- Both receive same seed and generate identical boards
- Client makes a valid move, other client sees score update
- Game finishes, both see standings
- Rematch flow resets state
- Error cases: empty name, invalid room code, non-host start

## Running Tests

```bash
# All tests
npm run test

# Shared package only
npm run test:shared

# Server only
npm run test:server
```

## Test Coverage Goals

| Area | Target | Rationale |
|------|--------|-----------|
| Shared/board engine | >90% | Core game logic, must be correct |
| Shared/scoring | >90% | Determines winners, must be deterministic |
| Server/RoomManager | >80% | Room lifecycle is critical |
| Server/GameController | >80% | Game orchestration is critical |
| Integration | Key flows | Verifies client-server contract |

## Manual QA Checklist

### Desktop
- [ ] Create room, see room code
- [ ] Copy room code to clipboard
- [ ] Join room from second tab
- [ ] Host badge visible for creator
- [ ] Non-host cannot start game
- [ ] Start game, see 3-2-1 countdown
- [ ] Board appears with correct dimensions (10x17)
- [ ] Drag to select rectangle, see sum preview
- [ ] Valid selection (sum=10) clears cells with animation
- [ ] Invalid selection does nothing
- [ ] Score and move count update immediately
- [ ] Leaderboard updates in real-time for other players
- [ ] Timer counts down correctly
- [ ] Timer turns red at 10 seconds
- [ ] Game ends when timer hits 0
- [ ] Results show correct standings
- [ ] Tie-break explanation shows when applicable
- [ ] Rematch resets board and scores
- [ ] Leave room returns to home

### Mobile
- [ ] Layout is responsive
- [ ] Touch drag works for selection
- [ ] No accidental scroll during drag
- [ ] Room code is readable
- [ ] Buttons are tap-friendly

### Edge Cases
- [ ] Refresh during lobby → reconnect works
- [ ] Refresh during game → reconnect restores board
- [ ] Host disconnects → new host promoted
- [ ] Join with invalid room code → error shown
- [ ] Join room after game started → error shown
- [ ] Submit move after game ends → rejected
- [ ] Solo play works (1 player)

### Performance
- [ ] Board renders smoothly at 10x17
- [ ] Selection drag is responsive (no lag)
- [ ] Score updates appear within ~100ms
