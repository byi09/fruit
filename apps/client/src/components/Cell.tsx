import { memo } from 'react';
import type { Cell as CellType } from '@fruitbox/shared';

// Apple colors based on cell value
const VALUE_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-emerald-600',
  3: 'text-amber-600',
  4: 'text-purple-600',
  5: 'text-red-600',
  6: 'text-teal-600',
  7: 'text-orange-600',
  8: 'text-pink-600',
  9: 'text-indigo-600',
};

const VALUE_BG: Record<number, string> = {
  1: 'bg-blue-50',
  2: 'bg-emerald-50',
  3: 'bg-amber-50',
  4: 'bg-purple-50',
  5: 'bg-red-50',
  6: 'bg-teal-50',
  7: 'bg-orange-50',
  8: 'bg-pink-50',
  9: 'bg-indigo-50',
};

interface CellProps {
  cell: CellType;
  clearing?: boolean;
}

export const CellView = memo(function CellView({ cell, clearing }: CellProps) {
  if (cell.cleared) {
    return <div className="game-cell game-cell-cleared" />;
  }

  return (
    <div
      className={`game-cell game-cell-active ${VALUE_BG[cell.value] || 'bg-white'} ${
        clearing ? 'animate-pop' : ''
      }`}
    >
      <div className="relative pointer-events-none flex items-center justify-center w-full h-full">
        <span className="text-lg sm:text-2xl leading-none">🍎</span>
        <span className={`absolute inset-0 flex items-center justify-center ${VALUE_COLORS[cell.value] || 'text-gray-800'} font-extrabold text-[10px] sm:text-xs drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]`}>
          {cell.value}
        </span>
      </div>
    </div>
  );
});
