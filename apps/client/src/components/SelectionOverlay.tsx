import { normalizeMove } from '@fruitbox/shared';

interface SelectionOverlayProps {
  start: { row: number; col: number };
  end: { row: number; col: number };
  rows: number;
  cols: number;
  isValid: boolean | null; // null = neutral/computing
}

export function SelectionOverlay({ start, end, rows, cols, isValid }: SelectionOverlayProps) {
  const move = normalizeMove({
    startRow: start.row,
    startCol: start.col,
    endRow: end.row,
    endCol: end.col,
  });

  const left = `${(move.startCol / cols) * 100}%`;
  const top = `${(move.startRow / rows) * 100}%`;
  const width = `${((move.endCol - move.startCol + 1) / cols) * 100}%`;
  const height = `${((move.endRow - move.startRow + 1) / rows) * 100}%`;

  const colorClass =
    isValid === true
      ? 'selection-rect-valid'
      : isValid === false
        ? 'selection-rect-invalid'
        : 'selection-rect-neutral';

  return (
    <div
      className={`selection-rect ${colorClass}`}
      style={{ left, top, width, height }}
    />
  );
}
