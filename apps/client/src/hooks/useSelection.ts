import { useState, useCallback, useRef, useMemo, type RefObject } from 'react';
import type { Move, Board } from '@fruitbox/shared';
import { normalizeMove } from '@fruitbox/shared';

interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SelectionState {
  isDragging: boolean;
  rect: PixelRect | null;
  selectedCells: Move | null; // normalized cell range
}

export function useSelection(
  board: Board | null,
  _targetSum: number,
  onCommit: (move: Move) => boolean,
  gridRef: RefObject<HTMLDivElement | null>,
) {
  const [selection, setSelection] = useState<SelectionState>({
    isDragging: false,
    rect: null,
    selectedCells: null,
  });
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const getRelativePoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      if (!gridRef.current) return null;
      const gridRect = gridRef.current.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(clientX - gridRect.left, gridRect.width)),
        y: Math.max(0, Math.min(clientY - gridRect.top, gridRect.height)),
      };
    },
    [gridRef],
  );

  const getCellsInRect = useCallback(
    (rect: PixelRect): Move | null => {
      if (!gridRef.current || !board) return null;
      const gridEl = gridRef.current;
      const gridRect = gridEl.getBoundingClientRect();
      const rows = board.length;
      const cols = board[0].length;
      const cellW = gridRect.width / cols;
      const cellH = gridRect.height / rows;

      const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max));

      // Map both endpoints of the drag to cells directly. Using rect.width-1
      // pushes a zero-size endpoint into the previous cell, so a thin
      // horizontal/vertical drag would collapse to a single row/col; the
      // epsilon below keeps a positive endpoint inside its own cell without
      // spilling past cell boundaries.
      const eps = 1e-4;
      const endPx = rect.x + Math.max(0, rect.width - eps);
      const endPy = rect.y + Math.max(0, rect.height - eps);

      return normalizeMove({
        startRow: clamp(Math.floor(rect.y / cellH), rows - 1),
        startCol: clamp(Math.floor(rect.x / cellW), cols - 1),
        endRow: clamp(Math.floor(endPy / cellH), rows - 1),
        endCol: clamp(Math.floor(endPx / cellW), cols - 1),
      });
    },
    [board, gridRef],
  );

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      const pt = getRelativePoint(clientX, clientY);
      if (!pt) return;
      startPoint.current = pt;
      const rect = { x: pt.x, y: pt.y, width: 0, height: 0 };
      setSelection({ isDragging: true, rect, selectedCells: getCellsInRect(rect) });
    },
    [getRelativePoint, getCellsInRect],
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!startPoint.current) return;
      const pt = getRelativePoint(clientX, clientY);
      if (!pt) return;

      const sp = startPoint.current;
      const x = Math.min(sp.x, pt.x);
      const y = Math.min(sp.y, pt.y);
      const width = Math.abs(pt.x - sp.x);
      const height = Math.abs(pt.y - sp.y);
      const rect = { x, y, width, height };

      setSelection({ isDragging: true, rect, selectedCells: getCellsInRect(rect) });
    },
    [getRelativePoint, getCellsInRect],
  );

  const handlePointerUp = useCallback(() => {
    const rect = selection.rect;
    startPoint.current = null;

    // Allow thin-line drags: either dimension meaningful is enough. Requiring
    // both would drop a purely horizontal/vertical drag (the other dim is ~0).
    const MIN_DRAG_PX = 4;
    if (rect && (rect.width >= MIN_DRAG_PX || rect.height >= MIN_DRAG_PX)) {
      const move = getCellsInRect(rect);
      if (move) {
        onCommit(move);
      }
    }

    setSelection({ isDragging: false, rect: null, selectedCells: null });
  }, [selection.rect, getCellsInRect, onCommit]);

  // Build a Set of "r,c" strings for O(1) lookup
  const selectedSet = useMemo(() => {
    const set = new Set<string>();
    const cells = selection.selectedCells;
    if (!cells) return set;
    for (let r = cells.startRow; r <= cells.endRow; r++) {
      for (let c = cells.startCol; c <= cells.endCol; c++) {
        set.add(`${r},${c}`);
      }
    }
    return set;
  }, [selection.selectedCells]);

  return {
    selection,
    selectedSet,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
