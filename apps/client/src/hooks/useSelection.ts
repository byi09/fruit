import { useState, useCallback, useRef, type RefObject } from 'react';
import type { Move, Board } from '@fruitbox/shared';

interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SelectionState {
  isDragging: boolean;
  rect: PixelRect | null;
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

      // Find which cells are inside the drawn rectangle
      const startCol = Math.floor(rect.x / cellW);
      const startRow = Math.floor(rect.y / cellH);
      const endCol = Math.floor((rect.x + rect.width - 1) / cellW);
      const endRow = Math.floor((rect.y + rect.height - 1) / cellH);

      const clampedStartRow = Math.max(0, Math.min(startRow, rows - 1));
      const clampedStartCol = Math.max(0, Math.min(startCol, cols - 1));
      const clampedEndRow = Math.max(0, Math.min(endRow, rows - 1));
      const clampedEndCol = Math.max(0, Math.min(endCol, cols - 1));

      return {
        startRow: clampedStartRow,
        startCol: clampedStartCol,
        endRow: clampedEndRow,
        endCol: clampedEndCol,
      };
    },
    [board, gridRef],
  );

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      const pt = getRelativePoint(clientX, clientY);
      if (!pt) return;
      startPoint.current = pt;
      setSelection({ isDragging: true, rect: { x: pt.x, y: pt.y, width: 0, height: 0 } });
    },
    [getRelativePoint],
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

      setSelection({ isDragging: true, rect: { x, y, width, height } });
    },
    [getRelativePoint],
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

    setSelection({ isDragging: false, rect: null });
  }, [selection.rect, getCellsInRect, onCommit]);

  return {
    selection,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
