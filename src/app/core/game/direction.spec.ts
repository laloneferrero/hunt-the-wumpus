import { directionLabel, step, turnLeft, turnRight } from './direction';
import { Direction } from '../models/game.models';

describe('direction', () => {
  const cycle: Direction[] = ['N', 'E', 'S', 'W'];

  it('turns 90 degrees left', () => {
    expect(turnLeft('N')).toBe('W');
    expect(turnLeft('W')).toBe('S');
    expect(turnLeft('S')).toBe('E');
    expect(turnLeft('E')).toBe('N');
  });

  it('turns 90 degrees right', () => {
    expect(turnRight('N')).toBe('E');
    expect(turnRight('E')).toBe('S');
    expect(turnRight('S')).toBe('W');
    expect(turnRight('W')).toBe('N');
  });

  it('returns to the same direction after four turns', () => {
    for (const start of cycle) {
      let left = start;
      let right = start;
      for (let i = 0; i < 4; i++) {
        left = turnLeft(left);
        right = turnRight(right);
      }
      expect(left).toBe(start);
      expect(right).toBe(start);
    }
  });

  it('steps one cell without wrapping the board', () => {
    expect(step({ row: 0, col: 0 }, 'E')).toEqual({ row: 0, col: 1 });
    expect(step({ row: 0, col: 0 }, 'N')).toEqual({ row: 1, col: 0 });
    expect(step({ row: 0, col: 0 }, 'W')).toEqual({ row: 0, col: -1 });
    expect(step({ row: 0, col: 0 }, 'S')).toEqual({ row: -1, col: 0 });
  });

  it('labels directions in Spanish', () => {
    expect(directionLabel('N')).toBe('Norte');
    expect(directionLabel('E')).toBe('Este');
    expect(directionLabel('S')).toBe('Sur');
    expect(directionLabel('W')).toBe('Oeste');
  });
});
