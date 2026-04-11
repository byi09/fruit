import { memo } from 'react';
import type { Cell as CellType } from '@fruitbox/shared';

interface CellProps {
  cell: CellType;
  selected?: boolean;
  clearing?: boolean;
}

export const CellView = memo(function CellView({ cell, selected, clearing }: CellProps) {
  if (cell.cleared) {
    return <div className="w-full h-full select-none" />;
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-75 ${
        clearing ? 'animate-pop' : ''
      } ${selected ? 'scale-110 z-[5]' : ''}`}
    >
      <span className="text-2xl sm:text-4xl leading-[1] pointer-events-none">{selected ? '🍏' : '🍎'}</span>
      <span
        className="absolute inset-0 flex items-center justify-center font-black text-white text-sm sm:text-base pointer-events-none"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}
      >
        {cell.value}
      </span>
    </div>
  );
});
