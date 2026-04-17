import type { Board, Move, GameConfig, SolverSolution } from '@fruitbox/shared';
import { useReplay } from '../hooks/useReplay';
import { CellView } from './Cell';

interface ReplayViewerProps {
  initialBoard: Board;
  config: GameConfig;
  solution: SolverSolution;
  onClose: () => void;
}

export function ReplayViewer({ initialBoard, config, solution, onClose }: ReplayViewerProps) {
  const {
    currentBoard,
    currentStep,
    totalSteps,
    nextMove,
    isPlaying,
    speed,
    stepForward,
    stepBack,
    goToStep,
    play,
    pause,
    setSpeed,
  } = useReplay(initialBoard, solution);

  // Count cleared cells at current step
  let clearedCount = 0;
  for (const row of currentBoard) {
    for (const cell of row) {
      if (cell.cleared) clearedCount++;
    }
  }

  const totalCells = config.rows * config.cols;

  // Build a set of cells that will be cleared by the next move (for highlighting)
  const highlightSet = new Set<string>();
  if (nextMove) {
    for (let r = nextMove.startRow; r <= nextMove.endRow; r++) {
      for (let c = nextMove.startCol; c <= nextMove.endCol; c++) {
        if (!currentBoard[r][c].cleared) {
          highlightSet.add(`${r},${c}`);
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-50">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Best Found Solution</h2>
            <p className="text-xs text-stone-400">
              {solution.totalCleared}/{totalCells} cells in {solution.moves.length} moves
              <span className="mx-1.5">·</span>
              solved in {(solution.solveTimeMs / 1000).toFixed(1)}s
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                       bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-700
                       border border-stone-200/60 transition-all"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="w-full max-w-5xl">
          <div
            className="relative grid rounded-xl select-none overflow-hidden bg-white border border-stone-200/60 shadow-card"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
              gridTemplateRows: `repeat(${config.rows}, 1fr)`,
            }}
          >
            {currentBoard.map((row, r) =>
              row.map((cell, c) => {
                const isHighlighted = highlightSet.has(`${r},${c}`);
                return (
                  <CellView
                    key={`${r}-${c}`}
                    cell={cell}
                    selected={isHighlighted}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="px-4 sm:px-6 py-4 border-t border-stone-200/50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-xl mx-auto">
          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={totalSteps}
              value={currentStep}
              onChange={(e) => goToStep(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Step info */}
            <div className="text-sm tabular-nums text-stone-500 w-32">
              Step {currentStep}/{totalSteps}
              <span className="text-stone-300 mx-1">·</span>
              {clearedCount} cleared
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToStep(0)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                title="Go to start"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M3 2.5a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5zm3.854.146a.5.5 0 0 1 0 .708L3.707 6.5H13.5a.5.5 0 0 1 0 1H3.707l3.147 3.146a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z"/>
                </svg>
              </button>
              <button
                onClick={stepBack}
                disabled={currentStep === 0}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-30"
                title="Step back"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                </svg>
              </button>
              <button
                onClick={isPlaying ? pause : play}
                disabled={currentStep >= totalSteps && !isPlaying}
                className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-30 mx-1"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                    <rect x="4" y="2" width="3" height="12" rx="0.5" />
                    <rect x="9" y="2" width="3" height="12" rx="0.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                    <polygon points="4,2 14,8 4,14" />
                  </svg>
                )}
              </button>
              <button
                onClick={stepForward}
                disabled={currentStep >= totalSteps}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-30"
                title="Step forward"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
              <button
                onClick={() => goToStep(totalSteps)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors"
                title="Go to end"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                  <path d="M13 2.5a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5zm-3.854.146a.5.5 0 0 1 .708 0l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L12.293 7.5H2.5a.5.5 0 0 1 0-1h9.793L9.146 3.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-2 w-32 justify-end">
              <span className="text-xs text-stone-400">Speed</span>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="text-xs bg-stone-100 border border-stone-200/60 rounded-md px-2 py-1 text-stone-600"
              >
                <option value={1000}>0.5x</option>
                <option value={500}>1x</option>
                <option value={250}>2x</option>
                <option value={100}>5x</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
