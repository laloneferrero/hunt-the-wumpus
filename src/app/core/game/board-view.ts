import { Direction, Position, START, samePosition } from '../models/game.models';
import { Board, cellAt } from './board';
import { directionLabel } from './direction';
import { perceive } from './perception';

export interface BoardCellView {
  id: string;
  row: number;
  col: number;
  light: boolean;
  visited: boolean;
  here: boolean;
  facing: Direction | null;
  icons: string[];
  label: string;
}

const BREEZE = '💨';
const STENCH = '🤢';
const PIT = '🕳️';
const WUMPUS = '👽';
const EXIT = '🚪';

export function visitKey(position: Position): string {
  return `${position.row},${position.col}`;
}

export function buildBoardView(options: {
  board: Board;
  position: Position;
  facing: Direction;
  visited: ReadonlySet<string>;
}): BoardCellView[] {
  const cells: BoardCellView[] = [];
  for (let row = options.board.size - 1; row >= 0; row--) {
    for (let col = 0; col < options.board.size; col++) {
      const position = { row, col };
      const here = samePosition(position, options.position);
      const visited = options.visited.has(visitKey(position));
      const icons = iconsFor(options.board, position, visited, here);
      cells.push({
        id: visitKey(position),
        row,
        col,
        light: (row + col) % 2 === 0,
        visited,
        here,
        facing: here ? options.facing : null,
        icons,
        label: cellLabel(position, options.facing, visited, here, icons),
      });
    }
  }
  return cells;
}

function iconsFor(board: Board, position: Position, visited: boolean, here: boolean): string[] {
  if (!visited) {
    return [];
  }

  const icons: string[] = [];
  const cell = cellAt(board, position);
  if (cell.pit) {
    icons.push(PIT);
  }
  if (cell.wumpus) {
    icons.push(WUMPUS);
  }

  const percepts = perceive(board, position);
  if (percepts.breeze) {
    icons.push(BREEZE);
  }
  if (percepts.stench) {
    icons.push(STENCH);
  }
  if (!here && samePosition(position, START)) {
    icons.push(EXIT);
  }
  return icons;
}

function cellLabel(
  position: Position,
  facing: Direction,
  visited: boolean,
  here: boolean,
  icons: string[],
): string {
  const place = `Fila ${position.row + 1}, columna ${position.col + 1}`;
  if (!visited) {
    return `${place}, sin explorar`;
  }

  const details: string[] = [];
  if (here) {
    details.push(`estás aquí mirando al ${directionLabel(facing).toLowerCase()}`);
  }
  if (icons.includes(PIT)) {
    details.push('pozo');
  }
  if (icons.includes(WUMPUS)) {
    details.push('Wumpus');
  }
  if (icons.includes(BREEZE)) {
    details.push('viento');
  }
  if (icons.includes(STENCH)) {
    details.push('hedor');
  }
  if (icons.includes(EXIT)) {
    details.push('salida');
  }
  return [place, ...details].join(', ');
}
