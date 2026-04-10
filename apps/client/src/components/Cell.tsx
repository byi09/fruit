import { memo } from 'react';
import type { Cell as CellType } from '@fruitbox/shared';

interface CellProps {
  cell: CellType;
  clearing?: boolean;
}

export const CellView = memo(function CellView({ cell, clearing }: CellProps) {
  if (cell.cleared) {
    return <div className="flex items-center justify-center select-none" style={{ aspectRatio: '1' }} />;
  }

  return (
    <div
      className={`flex items-center justify-center select-none ${clearing ? 'animate-pop' : ''}`}
      style={{ aspectRatio: '1' }}
    >
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <span className="text-xl sm:text-3xl leading-none">🍎</span>
        <span className="absolute inset-0 flex items-center justify-center font-black text-white text-xs sm:text-sm" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}>
          {cell.value}
        </span>
      </div>
    </div>
  );
});
