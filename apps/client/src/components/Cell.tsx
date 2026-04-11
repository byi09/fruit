import { memo } from 'react';
import type { Cell as CellType } from '@fruitbox/shared';

interface CellProps {
  cell: CellType;
  selected?: boolean;
  clearing?: boolean;
}

export const CellView = memo(function CellView({ cell, selected, clearing }: CellProps) {
  if (cell.cleared) {
    return <div className="flex items-center justify-center select-none" style={{ aspectRatio: '1' }} />;
  }

  return (
    <div
      className={`flex items-center justify-center select-none transition-transform duration-75 ${
        clearing ? 'animate-pop' : ''
      } ${selected ? 'scale-110 z-[5]' : ''}`}
      style={{ aspectRatio: '1' }}
    >
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <span className="text-2xl sm:text-4xl leading-none">{selected ? '🍏' : '🍎'}</span>
        <span
          className="absolute inset-0 flex items-center justify-center font-black text-white text-sm sm:text-base"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}
        >
          {cell.value}
        </span>
      </div>
    </div>
  );
});
