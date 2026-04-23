import { memo } from 'react';
import type { Cell as CellType } from '@fruitbox/shared';

interface CellProps {
  cell: CellType;
  selected?: boolean;
  clearing?: boolean;
}

export const CellView = memo(function CellView({ cell, selected, clearing }: CellProps) {
  if (cell.cleared) {
    return <div className="w-full aspect-square bg-cell-cleared" />;
  }

  return (
    <div
      className={`relative flex items-center justify-center aspect-square select-none transition-colors duration-75 ${
        clearing ? 'animate-pop' : ''
      } ${
        selected
          ? 'bg-accent/20 shadow-[inset_0_0_0_1px_rgba(233,69,96,0.45)]'
          : 'bg-cell hover:bg-cell-hover'
      }`}
    >
      <span className="text-xl sm:text-3xl leading-[1] pointer-events-none">
        {selected ? '🍏' : '🍎'}
      </span>
      <span
        className="absolute inset-0 flex items-center justify-center font-display font-extrabold pointer-events-none text-xs sm:text-sm"
        style={{ color: 'var(--cell-text)', textShadow: 'var(--cell-text-shadow)' }}
      >
        {cell.value}
      </span>
    </div>
  );
});
