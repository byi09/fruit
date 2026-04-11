import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type Board,
  type Move,
  type GameConfig,
  type StandingEntry,
  type RoundResult,
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

export function useGame(setScreen: (s: Screen) => void) {
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
  const boardRef = useRef<Board | null>(null);

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
      setEndsAt(data.endsAt);
      setMyScore(0);
      setMyMoves(0);
      setScores({});
      setStandings(null);
      setScreen('playing');
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
      setScreen('results');
    }

    socket.on('game:countdown', onCountdown);
    socket.on('game:started', onGameStarted);
    socket.on('game:score_update', onScoreUpdate);
    socket.on('game:finished', onGameFinished);

    return () => {
      socket.off('game:countdown', onCountdown);
      socket.off('game:started', onGameStarted);
      socket.off('game:score_update', onScoreUpdate);
      socket.off('game:finished', onGameFinished);
    };
  }, [setScreen]);

  const startGame = useCallback(() => {
    socket.emit('game:start', (res) => {
      if (!res.ok) {
        console.error('Failed to start game:', res.error);
      }
    });
  }, []);

  const submitMove = useCallback((move: Move): boolean => {
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

  // Restore board on reconnect if provided
  const restoreBoard = useCallback((restoredBoard: Board) => {
    setBoard(restoredBoard);
    boardRef.current = restoredBoard;
  }, []);

  return {
    board,
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
    startGame,
    submitMove,
    requestRematch,
    restoreBoard,
  };
}
