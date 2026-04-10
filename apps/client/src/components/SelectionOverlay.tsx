import { normalizeMove } from '@fruitbox/shared';

interface SelectionOverlayProps {
  start: { row: number; col: number };
  end: { row: number; col: number };
  rows: number;
  cols: number;
  isValid: boolean | null;
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

  const borderColor =
    isValid === true
      ? 'rgba(34, 197, 94, 0.9)'
      : isValid === false
        ? 'rgba(239, 68, 68, 0.7)'
        : 'rgba(59, 130, 246, 0.7)';

  const bgColor =
    isValid === true
      ? 'rgba(34, 197, 94, 0.15)'
      : isValid === false
        ? 'rgba(239, 68, 68, 0.1)'
        : 'rgba(59, 130, 246, 0.08)';

  return (
    <>
      {/* Dimmed overlay outside selection */}
      {/* Top */}
      <div className="absolute inset-0 pointer-events-none z-[9]" style={{
        top: 0, left: 0, right: 0,
        height: top,
        backgroundColor: 'rgba(0,0,0,0.15)',
      }} />
      {/* Bottom */}
      <div className="absolute pointer-events-none z-[9]" style={{
        top: `calc(${top} + ${height})`,
        left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.15)',
      }} />
      {/* Left */}
      <div className="absolute pointer-events-none z-[9]" style={{
        top,
        left: 0,
        width: left,
        height,
        backgroundColor: 'rgba(0,0,0,0.15)',
      }} />
      {/* Right */}
      <div className="absolute pointer-events-none z-[9]" style={{
        top,
        left: `calc(${left} + ${width})`,
        right: 0,
        height,
        backgroundColor: 'rgba(0,0,0,0.15)',
      }} />

      {/* Selection rectangle */}
      <div
        className="absolute pointer-events-none z-10 rounded-md"
        style={{
          left, top, width, height,
          border: `2px dashed ${borderColor}`,
          backgroundColor: bgColor,
          boxShadow: `0 0 0 1px ${borderColor}`,
        }}
      />
    </>
  );
}
