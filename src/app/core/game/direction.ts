import { Direction, Position } from '../models/game.models';

const ORDER: readonly Direction[] = ['N', 'E', 'S', 'W'];

export function turnLeft(direction: Direction): Direction {
  const index = ORDER.indexOf(direction);
  return ORDER[(index + 3) % 4];
}

export function turnRight(direction: Direction): Direction {
  const index = ORDER.indexOf(direction);
  return ORDER[(index + 1) % 4];
}

export function step(position: Position, direction: Direction): Position {
  switch (direction) {
    case 'N':
      return { row: position.row + 1, col: position.col };
    case 'E':
      return { row: position.row, col: position.col + 1 };
    case 'S':
      return { row: position.row - 1, col: position.col };
    case 'W':
      return { row: position.row, col: position.col - 1 };
  }
}

export function directionLabel(direction: Direction): string {
  switch (direction) {
    case 'N':
      return 'Norte';
    case 'E':
      return 'Este';
    case 'S':
      return 'Sur';
    case 'W':
      return 'Oeste';
  }
}
