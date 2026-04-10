import { useState, useCallback, useRef, type RefObject } from 'react';
import { type Move, type Board, getRectangleSum, normalizeMove } from '@fruitbox/shared';

interface CellPosition {
  row: number;
  col: number;
}

interface SelectionState {
  start: CellPosition | null;
  end: CellPosition | null;
  isDragging: boolean;
  sumInfo: { sum: number; count: number } | null;
}

export function useSelection(
  board: Board | null,
  targetSum: number,
  onCommit: (move: Move) => boolean,
  gridRef: RefObject<HTMLDivElement | null>,
) {
  const [selection, setSelection] = useState<SelectionState>({
    start: null,
    end: null,
    isDragging: false,
    sumInfo: null,
  });
  const startRef = useRef<CellPosition | null>(null);

  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): CellPosition | null => {
      if (!gridRef.current || !board) return null;
      const grid = gridRef.current;
      const rect = grid.getBoundingClientRect();
      const rows = board.length;
      const cols = board[0].length;
      const cellW = rect.width / cols;
      const cellH = rect.height / rows;

      const col = Math.floor((clientX - rect.left) / cellW);
      const row = Math.floor((clientY - rect.top) / cellH);

      if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
      return { row, col };
    },
    [board, gridRef],
  );

  const updateSumInfo = useCallback(
    (start: CellPosition, end: CellPosition) => {
      if (!board) return null;
      const move = normalizeMove({
        startRow: start.row,
        startCol: start.col,
        endRow: end.row,
        endCol: end.col,
      });
      return getRectangleSum(board, move);
    },
    [board],
  );

  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      const pos = getCellFromPoint(clientX, clientY);
      if (!pos) return;
      startRef.current = pos;
      const sumInfo = updateSumInfo(pos, pos);
      setSelection({ start: pos, end: pos, isDragging: true, sumInfo });
    },
    [getCellFromPoint, updateSumInfo],
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!startRef.current) return;
      const pos = getCellFromPoint(clientX, clientY);
      if (!pos) return;
      const sumInfo = updateSumInfo(startRef.current, pos);
      setSelection((prev) => ({ ...prev, end: pos, sumInfo }));
    },
    [getCellFromPoint, updateSumInfo],
  );

  const handlePointerUp = useCallback(() => {
    const start = startRef.current;
    const end = selection.end;
    startRef.current = null;

    if (start && end) {
      const move: Move = {
        startRow: start.row,
        startCol: start.col,
        endRow: end.row,
        endCol: end.col,
      };
      onCommit(move);
    }

    setSelection({ start: null, end: null, isDragging: false, sumInfo: null });
  }, [selection.end, onCommit]);

  return {
    selection,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
