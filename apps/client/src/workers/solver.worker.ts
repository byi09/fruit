import type { Board } from '@fruitbox/shared';
import { solveBoardBeam } from '@fruitbox/shared';

interface SolveMessage {
  type: 'solve';
  board: Board;
  targetSum: number;
  beamWidth: number;
  timeLimitMs: number;
}

self.onmessage = (e: MessageEvent<SolveMessage>) => {
  if (e.data.type !== 'solve') return;

  const { board, targetSum, beamWidth, timeLimitMs } = e.data;

  const solution = solveBoardBeam(board, targetSum, { beamWidth, timeLimitMs }, (progress) => {
    self.postMessage({ type: 'progress', solution: progress });
  });

  self.postMessage({ type: 'result', solution });
};
