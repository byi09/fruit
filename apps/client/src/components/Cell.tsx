import { memo } from 'react';
import type { Cell as CellType } from '@fruitbox/shared';

interface CellProps {
  cell: CellType;
  selected?: boolean;
  clearing?: boolean;
}

export const CellView = memo(function CellView({ cell, selected, clearing }: CellProps) {
  if (cell.cleared) {
    return <div className="w-full aspect-square bg-white/60" />;
  }

  return (
    <div
      className={`relative flex items-center justify-center aspect-square select-none transition-all duration-75 ${
        clearing ? 'animate-pop' : ''
      } ${
        selected
          ? 'bg-accent/15 scale-105 z-[5]'
          : 'bg-white hover:bg-stone-50'
      }`}
    >
      <span className="text-xl sm:text-3xl leading-[1] pointer-events-none">
        {selected ? '🍏' : '🍎'}
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center font-bold pointer-events-none text-xs sm:text-sm ${
          selected ? 'text-white' : 'text-white'
        }`}
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}
      >
        {cell.value}
      </span>
    </div>
  );
});
