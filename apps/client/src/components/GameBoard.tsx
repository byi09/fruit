import { useRef, useCallback } from 'react';
import type { Board, Move, GameConfig } from '@fruitbox/shared';
import { CellView } from './Cell';
import { SelectionOverlay } from './SelectionOverlay';
import { useSelection } from '../hooks/useSelection';

interface GameBoardProps {
  board: Board;
  config: GameConfig;
  onMove?: (move: Move) => boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export function GameBoard({ board, config, onMove, disabled, readOnly }: GameBoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const noop = useCallback(() => false, []);
  const { selection, selectedSet, handlePointerDown, handlePointerMove, handlePointerUp } =
    useSelection(board, config.targetSum, onMove ?? noop, gridRef);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || readOnly) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      handlePointerDown(e.clientX, e.clientY);
    },
    [disabled, readOnly, handlePointerDown],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || readOnly) return;
      handlePointerMove(e.clientX, e.clientY);
    },
    [disabled, readOnly, handlePointerMove],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly) return;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      handlePointerUp();
    },
    [readOnly, handlePointerUp],
  );

  return (
    <div className={`w-full max-w-5xl mx-auto transition-opacity duration-200 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div
        ref={gridRef}
        className="relative grid rounded-xl select-none touch-none overflow-hidden bg-white border border-stone-200/60 shadow-card"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gridTemplateRows: `repeat(${config.rows}, 1fr)`,
        }}
        onPointerDown={readOnly ? undefined : onPointerDown}
        onPointerMove={readOnly ? undefined : onPointerMove}
        onPointerUp={readOnly ? undefined : onPointerUp}
        onPointerCancel={readOnly ? undefined : onPointerUp}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <CellView
              key={`${r}-${c}`}
              cell={cell}
              selected={!readOnly && selectedSet.has(`${r},${c}`)}
            />
          )),
        )}

        {!readOnly && selection.isDragging && selection.rect && (
          <SelectionOverlay rect={selection.rect} />
        )}
      </div>
    </div>
  );
}
