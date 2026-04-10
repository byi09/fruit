import { useRef, useCallback } from 'react';
import type { Board, Move, GameConfig } from '@fruitbox/shared';
import { CellView } from './Cell';
import { SelectionOverlay } from './SelectionOverlay';
import { useSelection } from '../hooks/useSelection';

interface GameBoardProps {
  board: Board;
  config: GameConfig;
  onMove: (move: Move) => boolean;
  disabled?: boolean;
}

export function GameBoard({ board, config, onMove, disabled }: GameBoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const { selection, handlePointerDown, handlePointerMove, handlePointerUp } = useSelection(
    board,
    config.targetSum,
    onMove,
    gridRef,
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      handlePointerDown(e.clientX, e.clientY);
    },
    [disabled, handlePointerDown],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      handlePointerMove(e.clientX, e.clientY);
    },
    [disabled, handlePointerMove],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      handlePointerUp();
    },
    [handlePointerUp],
  );

  const isValid =
    selection.sumInfo !== null
      ? selection.sumInfo.count > 0 && selection.sumInfo.sum === config.targetSum
      : null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Sum preview — always reserves space to prevent layout shift */}
      <div className="text-center mb-2 h-8">
        {selection.isDragging && selection.sumInfo && (
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
              isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Sum: {selection.sumInfo.sum} / {config.targetSum}
            {selection.sumInfo.count > 0 && ` (${selection.sumInfo.count} apples)`}
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="relative grid gap-0 p-1 sm:p-2 bg-emerald-800/10 rounded-xl select-none touch-none"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gridTemplateRows: `repeat(${config.rows}, 1fr)`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <CellView key={`${r}-${c}`} cell={cell} />
          )),
        )}

        {/* Selection overlay */}
        {selection.isDragging && selection.start && selection.end && (
          <SelectionOverlay
            start={selection.start}
            end={selection.end}
            rows={config.rows}
            cols={config.cols}
            isValid={isValid}
          />
        )}
      </div>
    </div>
  );
}
