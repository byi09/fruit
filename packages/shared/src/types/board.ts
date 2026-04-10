export interface Cell {
  value: number;
  cleared: boolean;
}

export type Board = Cell[][];

export interface Move {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface MoveResult {
  valid: boolean;
  cellsCleared: number;
  reason?: 'sum_not_target' | 'no_uncleared_cells' | 'out_of_bounds';
}
