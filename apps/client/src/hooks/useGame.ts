import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type Board,
  type Move,
  type GameConfig,
  type StandingEntry,
  type RoundResult,
  type RoomState,
  generateBoard,
  validateMove,
  applyMove,
} from '@fruitbox/shared';
import { socket } from '../socket';
import type { Screen } from './useRoom';

interface ScoreInfo {
  playerId: string;
  score: number;
  movesMade: number;
}

interface UseGameOptions {
  isSpectator: boolean;
  roomState: RoomState | null;
  consumeInitialBoards: () => Record<string, Board> | null;
}

export function useGame(setScreen: (s: Screen) => void, options: UseGameOptions) {
  const { isSpectator, roomState, consumeInitialBoards } = options;
  const [board, setBoard] = useState<Board | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreInfo>>({});
  const [standings, setStandings] = useState<StandingEntry[] | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [myMoves, setMyMoves] = useState(0);
  const [lastClear, setLastClear] = useState<{ row: number; col: number; count: number } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedByName, setPausedByName] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [playerBoards, setPlayerBoards] = useState<Record<string, Board>>({});
  const [viewedPlayerId, setViewedPlayerId] = useState<string | null>(null);
  const boardRef = useRef<Board | null>(null);
  const roomStateRef = useRef<RoomState | null>(roomState);
  const isSpectatorRef = useRef(isSpectator);
  const consumeInitialBoardsRef = useRef(consumeInitialBoards);

  useEffect(() => {
    roomStateRef.current = roomState;
  }, [roomState]);
  useEffect(() => {
    isSpectatorRef.current = isSpectator;
  }, [isSpectator]);
  useEffect(() => {
    consumeInitialBoardsRef.current = consumeInitialBoards;
  }, [consumeInitialBoards]);

  // Keep ref in sync with state
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    function onCountdown(data: { startsAt: number }) {
      setStartsAt(data.startsAt);
      setScreen('countdown');
    }

    function onGameStarted(data: { seed: number; endsAt: number; config: GameConfig }) {
      const newBoard = generateBoard(data.seed, data.config.rows, data.config.cols);
      setBoard(newBoard);
      boardRef.current = newBoard;
      setConfig(data.config);
      setSeed(data.seed);
      setEndsAt(data.endsAt);
      setMyScore(0);
      setMyMoves(0);
      setScores({});
      setStandings(null);
      setIsPaused(false);
      setPausedByName(null);

      if (isSpectatorRef.current) {
        const rs = roomStateRef.current;
        const activeIds = rs
          ? Object.values(rs.players)
              .filter((p) => !p.isSpectator)
              .map((p) => p.id)
          : [];
        const boards: Record<string, Board> = {};
        for (const pid of activeIds) {
          boards[pid] = generateBoard(data.seed, data.config.rows, data.config.cols);
        }
        setPlayerBoards(boards);
        setViewedPlayerId((prev) => (prev && boards[prev] ? prev : activeIds[0] ?? null));
      }

      setScreen('playing');
    }

    function onBoardUpdate(data: { playerId: string; board: Board }) {
      setPlayerBoards((prev) => ({ ...prev, [data.playerId]: data.board }));
    }

    function onScoreUpdate(data: { playerId: string; score: number; movesMade: number }) {
      setScores((prev) => ({
        ...prev,
        [data.playerId]: data,
      }));
    }

    function onGameFinished(data: { standings: StandingEntry[]; roundNumber: number; roundHistory: RoundResult[] }) {
      setStandings(data.standings);
      setRoundNumber(data.roundNumber);
      setRoundHistory(data.roundHistory);
      setIsPaused(false);
      setPausedByName(null);
      setScreen('results');
    }

    function onGamePaused(data: { pausedBy: string; playerName: string }) {
      setIsPaused(true);
      setPausedByName(data.playerName);
    }

    function onGameResumed(data: { endsAt: number }) {
      setEndsAt(data.endsAt);
      setIsPaused(false);
      setPausedByName(null);
    }

    socket.on('game:countdown', onCountdown);
    socket.on('game:started', onGameStarted);
    socket.on('game:score_update', onScoreUpdate);
    socket.on('game:finished', onGameFinished);
    socket.on('game:paused', onGamePaused);
    socket.on('game:resumed', onGameResumed);
    socket.on('game:board_update', onBoardUpdate);

    return () => {
      socket.off('game:countdown', onCountdown);
      socket.off('game:started', onGameStarted);
      socket.off('game:score_update', onScoreUpdate);
      socket.off('game:finished', onGameFinished);
      socket.off('game:paused', onGamePaused);
      socket.off('game:resumed', onGameResumed);
      socket.off('game:board_update', onBoardUpdate);
    };
  }, [setScreen]);

  // When a spectator joins mid-game, the join ack includes a snapshot of each
  // active player's board. Hydrate playerBoards from that snapshot so the
  // spectator sees the current state, not the initial seed-generated board.
  useEffect(() => {
    if (!isSpectator || !roomState) return;
    const snap = consumeInitialBoardsRef.current();
    if (!snap) return;
    setPlayerBoards((prev) => ({ ...prev, ...snap }));
    setViewedPlayerId((prev) => {
      if (prev && snap[prev]) return prev;
      const firstId = Object.keys(snap)[0];
      return firstId ?? prev;
    });
    // Also hydrate config/endsAt so the playing screen renders.
    setConfig((prev) => prev ?? (roomState.config ?? null));
    setEndsAt((prev) => prev ?? (roomState.gameEndsAt ?? null));
    setSeed((prev) => prev ?? (roomState.seed || null));
  }, [isSpectator, roomState]);

  const startGame = useCallback(() => {
    socket.emit('game:start', (res) => {
      if (!res.ok) {
        console.error('Failed to start game:', res.error);
      }
    });
  }, []);

  const submitMove = useCallback((move: Move): boolean => {
    if (isSpectatorRef.current) return false;
    const currentBoard = boardRef.current;
    if (!currentBoard || !config) return false;

    // Local validation for instant feedback
    const localResult = validateMove(currentBoard, move, config.targetSum);
    if (!localResult.valid) return false;

    // Optimistically apply
    const newBoard = applyMove(currentBoard, move);
    setBoard(newBoard);
    boardRef.current = newBoard;
    setMyScore((prev) => prev + localResult.cellsCleared);
    setMyMoves((prev) => prev + 1);
    setLastClear({ row: move.startRow, col: move.startCol, count: localResult.cellsCleared });
    setTimeout(() => setLastClear(null), 500);

    // Send to server for authoritative validation
    socket.emit('game:move', move, (result) => {
      if (!result.valid) {
        // Revert optimistic update (should be rare if client validation is correct)
        console.warn('Server rejected move that client accepted');
      }
    });

    return true;
  }, [config]);

  const requestRematch = useCallback(() => {
    socket.emit('game:rematch', (res) => {
      if (!res.ok) {
        console.error('Rematch failed:', res.error);
      }
    });
  }, []);

  const pauseGame = useCallback(() => {
    socket.emit('game:pause', (res) => {
      if (!res.ok) {
        console.error('Pause failed:', res.error);
      }
    });
  }, []);

  const resumeGame = useCallback(() => {
    socket.emit('game:resume', (res) => {
      if (!res.ok) {
        console.error('Resume failed:', res.error);
      }
    });
  }, []);

  // Restore board on reconnect if provided
  const restoreBoard = useCallback((restoredBoard: Board) => {
    setBoard(restoredBoard);
    boardRef.current = restoredBoard;
  }, []);

  const viewedBoard = viewedPlayerId ? playerBoards[viewedPlayerId] ?? null : null;

  return {
    board,
    viewedBoard,
    playerBoards,
    viewedPlayerId,
    setViewedPlayerId,
    seed,
    config,
    endsAt,
    startsAt,
    scores,
    standings,
    roundNumber,
    roundHistory,
    myScore,
    myMoves,
    lastClear,
    isPaused,
    pausedByName,
    startGame,
    submitMove,
    requestRematch,
    restoreBoard,
    pauseGame,
    resumeGame,
  };
}
