import {
  GameConfig,
  MAX_SIZE,
  MIN_SIZE,
  Position,
  START,
  samePosition,
} from '../models/game.models';

export interface Cell {
  pit: boolean;
  wumpus: boolean;
  gold: boolean;
}

export interface Board {
  size: number;
  cells: Cell[][];
  wumpusAlive: boolean;
  goldCollected: boolean;
}

export type Rng = () => number;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export interface FixedBoardOptions {
  size: number;
  pits: Position[];
  wumpus: Position;
  gold: Position;
}

export function validateConfig(config: GameConfig): string | null {
  if (!Number.isInteger(config.size) || config.size < MIN_SIZE || config.size > MAX_SIZE) {
    return `El tamaño debe ser un entero entre ${MIN_SIZE} y ${MAX_SIZE}.`;
  }
  if (!Number.isInteger(config.pits) || config.pits < 0) {
    return 'El número de pozos debe ser un entero mayor o igual que 0.';
  }
  if (!Number.isInteger(config.arrows) || config.arrows < 0) {
    return 'El número de flechas debe ser un entero mayor o igual que 0.';
  }
  const available = config.size * config.size - 1;
  if (config.pits + 2 > available) {
    return `No caben ${config.pits} pozos, el Wumpus y el oro en un tablero de ${config.size}×${config.size}.`;
  }
  return null;
}

export function emptyCell(): Cell {
  return { pit: false, wumpus: false, gold: false };
}

export function createFixedBoard(options: FixedBoardOptions): Board {
  const cells: Cell[][] = [];
  for (let row = 0; row < options.size; row++) {
    const line: Cell[] = [];
    for (let col = 0; col < options.size; col++) {
      line.push(emptyCell());
    }
    cells.push(line);
  }

  const occupy = (position: Position, kind: keyof Cell): void => {
    if (!isInside(options.size, position)) {
      throw new ConfigError('Hay una pieza fuera del tablero.');
    }
    if (samePosition(position, START)) {
      throw new ConfigError('La casilla de salida debe estar vacía.');
    }
    const cell = cells[position.row][position.col];
    if (cell.pit || cell.wumpus || cell.gold) {
      throw new ConfigError('Dos piezas ocupan la misma casilla.');
    }
    cell[kind] = true;
  };

  for (const pit of options.pits) {
    occupy(pit, 'pit');
  }
  occupy(options.wumpus, 'wumpus');
  occupy(options.gold, 'gold');

  return {
    size: options.size,
    cells,
    wumpusAlive: true,
    goldCollected: false,
  };
}

export function generateBoard(config: GameConfig, rng: Rng = Math.random): Board {
  const error = validateConfig(config);
  if (error) {
    throw new ConfigError(error);
  }

  const free: Position[] = [];
  for (let row = 0; row < config.size; row++) {
    for (let col = 0; col < config.size; col++) {
      const position = { row, col };
      if (!samePosition(position, START)) {
        free.push(position);
      }
    }
  }
  shuffle(free, rng);

  return createFixedBoard({
    size: config.size,
    wumpus: free[0],
    gold: free[1],
    pits: free.slice(2, 2 + config.pits),
  });
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function inBounds(board: Board, position: Position): boolean {
  return isInside(board.size, position);
}

export function cellAt(board: Board, position: Position): Cell {
  return board.cells[position.row][position.col];
}

export function neighbors(board: Board, position: Position): Position[] {
  const deltas = [
    { row: 1, col: 0 },
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: -1 },
  ];
  return deltas
    .map((delta) => ({ row: position.row + delta.row, col: position.col + delta.col }))
    .filter((next) => inBounds(board, next));
}

function isInside(size: number, position: Position): boolean {
  return position.row >= 0 && position.col >= 0 && position.row < size && position.col < size;
}

function shuffle<T>(items: T[], rng: Rng): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const current = items[i];
    items[i] = items[j];
    items[j] = current;
  }
}
