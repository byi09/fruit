import { useRef, useCallback, useState, useMemo } from 'react';
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

interface Particle {
  id: string;
  left: number;
  top: number;
  dx: number;
  dy: number;
}

export function GameBoard({ board, config, onMove, disabled, readOnly }: GameBoardProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  const spawnParticles = useCallback((move: Move) => {
    const gridEl = gridRef.current;
    if (!gridEl) return;
    const gridRect = gridEl.getBoundingClientRect();
    const rows = board.length;
    const cols = board[0].length;
    const cellW = gridRect.width / cols;
    const cellH = gridRect.height / rows;

    const next: Particle[] = [];
    for (let r = move.startRow; r <= move.endRow; r++) {
      for (let c = move.startCol; c <= move.endCol; c++) {
        if (board[r]?.[c]?.cleared) continue;
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 40;
        const id = `${Date.now()}-${r}-${c}-${Math.random().toString(36).slice(2, 6)}`;
        next.push({
          id,
          left: c * cellW + cellW / 2,
          top: r * cellH + cellH / 2,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
        });
      }
    }
    if (next.length === 0) return;
    setParticles((prev) => [...prev, ...next]);
    const ids = new Set(next.map((p) => p.id));
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 700);
  }, [board]);

  const handleCommit = useCallback(
    (move: Move): boolean => {
      if (!onMove) return false;
      const ok = onMove(move);
      if (ok) spawnParticles(move);
      return ok;
    },
    [onMove, spawnParticles],
  );

  const noop = useCallback(() => false, []);
  const { selection, selectedSet, handlePointerDown, handlePointerMove, handlePointerUp } =
    useSelection(board, config.targetSum, onMove ? handleCommit : noop, gridRef);

  const currentSum = useMemo(() => {
    if (!selection.isDragging || !selection.selectedCells) return 0;
    let sum = 0;
    for (const key of selectedSet) {
      const [r, c] = key.split(',').map(Number);
      const cell = board[r]?.[c];
      if (cell && !cell.cleared) sum += cell.value;
    }
    return sum;
  }, [selection.isDragging, selection.selectedCells, selectedSet, board]);

  const isValidSum = selection.isDragging && currentSum === config.targetSum;

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
      {/* Sum badge */}
      <div className="flex justify-center mb-2 h-7">
        {selection.isDragging && (
          <div
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[20px] text-xs font-display font-bold backdrop-blur-md border transition-colors ${
              isValidSum
                ? 'bg-emerald/15 border-emerald/40 text-emerald shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-panel border-border text-text-2'
            }`}
          >
            <span className="tabular-nums">{currentSum}</span>
            <span className="opacity-60">/</span>
            <span className="tabular-nums opacity-70">{config.targetSum}</span>
          </div>
        )}
      </div>

      {/* Board frame */}
      <div
        className="relative p-[10px]"
        style={{
          background: 'var(--board-frame-bg)',
          borderRadius: 18,
          boxShadow: 'var(--shadow-board)',
        }}
      >
        <div
          ref={gridRef}
          className="relative grid select-none touch-none overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
            gridTemplateRows: `repeat(${config.rows}, 1fr)`,
            gap: 2,
            borderRadius: 10,
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
            <SelectionOverlay rect={selection.rect} valid={isValidSum} />
          )}

          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute text-lg sm:text-2xl animate-particle-fly"
                style={{
                  left: p.left,
                  top: p.top,
                  transform: 'translate(-50%, -50%)',
                  // CSS vars consumed by the particleFly keyframes
                  ['--dx' as string]: `${p.dx}px`,
                  ['--dy' as string]: `${p.dy}px`,
                }}
              >
                🍎
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hint */}
      {!readOnly && (
        <p className="text-center text-[11px] text-text-3 mt-3">
          Drag to select · Sum must equal{' '}
          <span className="text-accent font-bold font-display">{config.targetSum}</span>
        </p>
      )}
    </div>
  );
}
