import { createFixedBoard } from './board';
import { perceive } from './perception';

describe('perception', () => {
  const board = createFixedBoard({
    size: 4,
    pits: [{ row: 1, col: 1 }],
    wumpus: { row: 0, col: 2 },
    gold: { row: 2, col: 0 },
  });

  it('smells the wumpus only on orthogonal neighbors', () => {
    expect(perceive(board, { row: 0, col: 1 }).stench).toBeTrue();
    expect(perceive(board, { row: 0, col: 3 }).stench).toBeTrue();
    expect(perceive(board, { row: 1, col: 2 }).stench).toBeTrue();
    expect(perceive(board, { row: 1, col: 3 }).stench).toBeFalse();
    expect(perceive(board, { row: 0, col: 0 }).stench).toBeFalse();
  });

  it('feels a breeze only on orthogonal neighbors of a pit', () => {
    expect(perceive(board, { row: 1, col: 0 }).breeze).toBeTrue();
    expect(perceive(board, { row: 0, col: 1 }).breeze).toBeTrue();
    expect(perceive(board, { row: 0, col: 0 }).breeze).toBeFalse();
    expect(perceive(board, { row: 2, col: 2 }).breeze).toBeFalse();
  });

  it('glitters on the gold cell until it is collected', () => {
    expect(perceive(board, { row: 2, col: 0 }).glitter).toBeTrue();
    expect(perceive(board, { row: 2, col: 1 }).glitter).toBeFalse();
    board.goldCollected = true;
    expect(perceive(board, { row: 2, col: 0 }).glitter).toBeFalse();
    board.goldCollected = false;
  });

  it('stops the stench after the wumpus dies', () => {
    board.wumpusAlive = false;
    expect(perceive(board, { row: 0, col: 1 }).stench).toBeFalse();
    expect(perceive(board, { row: 0, col: 2 }).wumpus).toBeFalse();
    board.wumpusAlive = true;
  });

  it('reports the living wumpus on its own cell', () => {
    expect(perceive(board, { row: 0, col: 2 }).wumpus).toBeTrue();
    expect(perceive(board, { row: 0, col: 2 }).stench).toBeFalse();
  });

  it('keeps bump and scream as one-action signals', () => {
    const percepts = perceive(board, { row: 0, col: 0 }, { bump: true, scream: true });
    expect(percepts.bump).toBeTrue();
    expect(percepts.scream).toBeTrue();
  });
});
