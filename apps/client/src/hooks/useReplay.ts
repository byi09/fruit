import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Board, Move, SolverSolution } from '@fruitbox/shared';
import { applyMove } from '@fruitbox/shared';

export function useReplay(initialBoard: Board, solution: SolverSolution) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per step
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = solution.moves.length;

  // Pre-compute all board states
  const boardStates = useMemo(() => {
    const states: Board[] = [initialBoard];
    let board = initialBoard;
    for (const move of solution.moves) {
      board = applyMove(board, move);
      states.push(board);
    }
    return states;
  }, [initialBoard, solution]);

  const currentBoard = boardStates[currentStep];
  // The move that was just applied (or null at step 0)
  const currentMove = currentStep > 0 ? solution.moves[currentStep - 1] : null;
  // The move about to be applied (for highlighting)
  const nextMove = currentStep < totalSteps ? solution.moves[currentStep] : null;

  const stepForward = useCallback(() => {
    setCurrentStep(s => Math.min(s + 1, totalSteps));
  }, [totalSteps]);

  const stepBack = useCallback(() => {
    setCurrentStep(s => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps)));
  }, [totalSteps]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  // Auto-play interval
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(s => {
          if (s >= totalSteps) {
            setIsPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, totalSteps]);

  return {
    currentBoard,
    currentStep,
    totalSteps,
    currentMove,
    nextMove,
    isPlaying,
    speed,
    stepForward,
    stepBack,
    goToStep,
    play,
    pause,
    setSpeed,
  };
}
