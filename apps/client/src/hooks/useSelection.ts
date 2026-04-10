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

      const startCol = Math.floor(rect.x / cellW);
      const startRow = Math.floor(rect.y / cellH);
      const endCol = Math.floor((rect.x + rect.width - 1) / cellW);
      const endRow = Math.floor((rect.y + rect.height - 1) / cellH);

      return normalizeMove({
        startRow: Math.max(0, Math.min(startRow, rows - 1)),
        startCol: Math.max(0, Math.min(startCol, cols - 1)),
        endRow: Math.max(0, Math.min(endRow, rows - 1)),
        endCol: Math.max(0, Math.min(endCol, cols - 1)),
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

    if (rect && rect.width > 2 && rect.height > 2) {
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
