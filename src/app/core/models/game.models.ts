export type Direction = 'N' | 'E' | 'S' | 'W';

export type GameStatus = 'playing' | 'won' | 'lost';

export type DeathCause = 'pit' | 'wumpus';

export type Command = 'forward' | 'left' | 'right' | 'shoot' | 'climb';

export type MessageKey =
  'no-arrows' | 'need-gold' | 'not-at-exit' | 'game-over' | 'arrow-miss' | 'arrow-hit';

export interface Position {
  row: number;
  col: number;
}

export interface GameConfig {
  size: number;
  pits: number;
  arrows: number;
}

export interface Percepts {
  stench: boolean;
  breeze: boolean;
  glitter: boolean;
  bump: boolean;
  scream: boolean;
  wumpus: boolean;
}

export interface ActionResult {
  ok: boolean;
  counted: boolean;
  percepts: Percepts;
  status: GameStatus;
  deathCause?: DeathCause;
  messageKey?: MessageKey;
}

export const MIN_SIZE = 3;
export const MAX_SIZE = 12;
export const DEFAULT_SIZE = 4;
export const DEFAULT_PITS = 2;
export const DEFAULT_ARROWS = 1;

export const START: Position = { row: 0, col: 0 };

export function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function emptyPercepts(): Percepts {
  return {
    stench: false,
    breeze: false,
    glitter: false,
    bump: false,
    scream: false,
    wumpus: false,
  };
}
