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

  const { selection, selectedSet, handlePointerDown, handlePointerMove, handlePointerUp } =
    useSelection(board, config.targetSum, onMove, gridRef);

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

  return (
    <div className={`w-full max-w-5xl mx-auto transition-opacity duration-200 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div
        ref={gridRef}
        className="relative grid rounded-xl select-none touch-none overflow-hidden bg-surface border border-white/[0.06]"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gridTemplateRows: `repeat(${config.rows}, 1fr)`,
          gap: '1px',
          padding: '1px',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0.03))',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <CellView
              key={`${r}-${c}`}
              cell={cell}
              selected={selectedSet.has(`${r},${c}`)}
            />
          )),
        )}

        {selection.isDragging && selection.rect && (
          <SelectionOverlay rect={selection.rect} />
        )}
      </div>
    </div>
  );
}
