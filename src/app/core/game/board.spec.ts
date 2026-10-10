import {
  Board,
  ConfigError,
  cellAt,
  createFixedBoard,
  generateBoard,
  mulberry32,
  neighbors,
  validateConfig,
} from './board';
import { START } from '../models/game.models';

describe('board', () => {
  it('rejects a size outside 3..12', () => {
    expect(validateConfig({ size: 2, pits: 0, arrows: 1 })).toContain('tamaño');
    expect(validateConfig({ size: 13, pits: 0, arrows: 1 })).toContain('tamaño');
  });

  it('rejects negative pits or arrows and non-integers', () => {
    expect(validateConfig({ size: 4, pits: -1, arrows: 1 })).toContain('pozos');
    expect(validateConfig({ size: 4, pits: 1.5, arrows: 1 })).toContain('pozos');
    expect(validateConfig({ size: 4, pits: 0, arrows: -1 })).toContain('flechas');
  });

  it('rejects a layout that cannot fit the wumpus and the gold', () => {
    expect(validateConfig({ size: 3, pits: 7, arrows: 0 })).toContain('No caben');
    expect(validateConfig({ size: 3, pits: 6, arrows: 0 })).toBeNull();
  });

  it('throws when generating an impossible configuration', () => {
    expect(() => generateBoard({ size: 3, pits: 7, arrows: 1 })).toThrowError(ConfigError);
  });

  it('places the requested pieces away from the exit', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const board = generateBoard({ size: 5, pits: 3, arrows: 1 }, mulberry32(seed));
      expect(board.size).toBe(5);
      expect(cellAt(board, START)).toEqual({ pit: false, wumpus: false, gold: false });
      expect(count(board, 'pit')).toBe(3);
      expect(count(board, 'wumpus')).toBe(1);
      expect(count(board, 'gold')).toBe(1);
    }
  });

  it('repeats the same layout for the same seed', () => {
    const first = generateBoard({ size: 4, pits: 2, arrows: 1 }, mulberry32(42));
    const second = generateBoard({ size: 4, pits: 2, arrows: 1 }, mulberry32(42));
    expect(first.cells).toEqual(second.cells);
  });

  it('lists only orthogonal neighbors', () => {
    const board = createFixedBoard({
      size: 3,
      pits: [{ row: 1, col: 2 }],
      wumpus: { row: 2, col: 2 },
      gold: { row: 2, col: 1 },
    });
    expect(neighbors(board, { row: 1, col: 1 })).toEqual([
      { row: 2, col: 1 },
      { row: 0, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 0 },
    ]);
  });
});

function count(board: Board, kind: 'pit' | 'wumpus' | 'gold'): number {
  let total = 0;
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell[kind]) {
        total += 1;
      }
    }
  }
  return total;
}
