import { createFixedBoard } from './board';
import { buildBoardView, visitKey } from './board-view';

describe('buildBoardView', () => {
  const board = createFixedBoard({
    size: 4,
    pits: [{ row: 0, col: 1 }],
    wumpus: { row: 1, col: 0 },
    gold: { row: 3, col: 3 },
  });

  it('draws north at the top and keeps unvisited hazards hidden', () => {
    const cells = buildBoardView({
      board,
      position: { row: 0, col: 0 },
      facing: 'E',
      visited: new Set([visitKey({ row: 0, col: 0 })]),
    });

    expect(cells[0]).toEqual(jasmine.objectContaining({ row: 3, col: 0, icons: [] }));
    expect(cells[cells.length - 1]).toEqual(
      jasmine.objectContaining({ row: 0, col: 3, icons: [] }),
    );

    const start = cells.find((cell) => cell.row === 0 && cell.col === 0);
    expect(start?.facing).toBe('E');
    expect(start?.icons).toEqual(['💨', '🤢']);
    expect(cells.some((cell) => cell.icons.includes('👽'))).toBeFalse();
    expect(cells.some((cell) => cell.icons.includes('🕳️'))).toBeFalse();
  });

  it('drops the stench after the wumpus dies and still marks a visited body', () => {
    board.wumpusAlive = false;
    let cells;
    try {
      cells = buildBoardView({
        board,
        position: { row: 1, col: 0 },
        facing: 'N',
        visited: new Set([visitKey({ row: 0, col: 0 }), visitKey({ row: 1, col: 0 })]),
      });
    } finally {
      board.wumpusAlive = true;
    }

    const start = cells.find((cell) => cell.row === 0 && cell.col === 0);
    const body = cells.find((cell) => cell.row === 1 && cell.col === 0);
    expect(start?.facing).toBeNull();
    expect(start?.icons).toEqual(['💨', '🚪']);
    expect(body?.facing).toBe('N');
    expect(body?.icons).toContain('👽');
  });
});
