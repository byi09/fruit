import { useState, useCallback, useRef } from 'react';
import type { Board, SolverSolution } from '@fruitbox/shared';

export function useSolver() {
  const [solution, setSolution] = useState<SolverSolution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const startSolve = useCallback((board: Board, targetSum: number) => {
    // Terminate any existing worker
    workerRef.current?.terminate();

    setIsRunning(true);
    setSolution(null);

    const worker = new Worker(
      new URL('../workers/solver.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setSolution(e.data.solution);
      } else if (e.data.type === 'result') {
        setSolution(e.data.solution);
        setIsRunning(false);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = () => {
      setIsRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({
      type: 'solve',
      board,
      targetSum,
      beamWidth: 200,
      timeLimitMs: 5000,
    });
  }, []);

  const cancelSolve = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setIsRunning(false);
  }, []);

  return { solution, isRunning, startSolve, cancelSolve };
}
