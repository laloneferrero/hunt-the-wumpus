import { createFixedBoard } from './board';
import { GameEngine } from './game-engine';
import { START } from '../models/game.models';

describe('GameEngine', () => {
  it('bumps into a wall and stays in place', () => {
    const engine = makeEngine({ facing: 'W' });
    const result = engine.forward();

    expect(result.percepts.bump).toBeTrue();
    expect(engine.position).toEqual(START);
    expect(engine.actions).toBe(1);
    expect(engine.status).toBe('playing');
  });

  it('dies when entering a pit and then ignores orders', () => {
    const engine = makeEngine({ pits: [{ row: 0, col: 1 }] });
    const death = engine.forward();

    expect(death.status).toBe('lost');
    expect(death.deathCause).toBe('pit');
    expect(engine.actions).toBe(1);

    const ignored = engine.forward();
    expect(ignored.ok).toBeFalse();
    expect(ignored.messageKey).toBe('game-over');
    expect(engine.actions).toBe(1);
    expect(engine.turnLeft().counted).toBeFalse();
    expect(engine.shoot().counted).toBeFalse();
    expect(engine.climb().counted).toBeFalse();
  });

  it('dies when entering the living wumpus cell', () => {
    const engine = makeEngine({
      facing: 'N',
      wumpus: { row: 1, col: 0 },
      pits: [{ row: 3, col: 1 }],
      gold: { row: 3, col: 3 },
    });
    const adjacent = engine.lastPercepts;
    expect(adjacent.stench).toBeTrue();

    const death = engine.forward();
    expect(death.status).toBe('lost');
    expect(death.deathCause).toBe('wumpus');
    expect(death.percepts.wumpus).toBeTrue();
  });

  it('kills a wumpus several cells away and then allows entering its cell', () => {
    const engine = makeEngine({
      wumpus: { row: 0, col: 3 },
      pits: [{ row: 3, col: 3 }],
      gold: { row: 3, col: 2 },
    });

    const shot = engine.shoot();
    expect(shot.percepts.scream).toBeTrue();
    expect(shot.messageKey).toBe('arrow-hit');
    expect(engine.arrows).toBe(0);
    expect(engine.board.wumpusAlive).toBeFalse();

    engine.forward();
    expect(engine.position).toEqual({ row: 0, col: 1 });
    expect(engine.lastPercepts.stench).toBeFalse();
    engine.forward();
    engine.forward();
    expect(engine.position).toEqual({ row: 0, col: 3 });
    expect(engine.status).toBe('playing');
  });

  it('loses the arrow when it reaches the wall first', () => {
    const engine = makeEngine({
      facing: 'W',
      wumpus: { row: 2, col: 2 },
      pits: [{ row: 3, col: 1 }],
    });
    const shot = engine.shoot();

    expect(shot.messageKey).toBe('arrow-miss');
    expect(shot.percepts.scream).toBeFalse();
    expect(engine.board.wumpusAlive).toBeTrue();
    expect(engine.arrows).toBe(0);
    expect(engine.position).toEqual(START);
  });

  it('does not count a shot when there are no arrows left', () => {
    const engine = makeEngine({ arrows: 0 });
    const shot = engine.shoot();

    expect(shot.ok).toBeFalse();
    expect(shot.messageKey).toBe('no-arrows');
    expect(engine.actions).toBe(0);
    expect(engine.arrows).toBe(0);
  });

  it('collects the gold on entry and stops glittering afterwards', () => {
    const engine = makeEngine({ gold: { row: 0, col: 1 }, pits: [{ row: 3, col: 3 }] });
    const entry = engine.forward();

    expect(entry.percepts.glitter).toBeTrue();
    expect(engine.hasGold).toBeTrue();

    const later = engine.turnLeft();
    expect(later.percepts.glitter).toBeFalse();
    expect(engine.hasGold).toBeTrue();
  });

  it('refuses to leave without the gold or away from the exit', () => {
    const engine = makeEngine();
    const early = engine.climb();
    expect(early.messageKey).toBe('need-gold');
    expect(early.counted).toBeFalse();
    expect(engine.status).toBe('playing');

    engine.forward();
    const away = engine.climb();
    expect(away.messageKey).toBe('not-at-exit');
    expect(engine.status).toBe('playing');
  });

  it('wins by returning to the exit with the gold', () => {
    const engine = makeEngine({
      gold: { row: 0, col: 1 },
      pits: [{ row: 3, col: 3 }],
      wumpus: { row: 3, col: 2 },
    });

    engine.forward();
    engine.turnRight();
    engine.turnRight();
    engine.forward();
    const victory = engine.climb();

    expect(engine.position).toEqual(START);
    expect(victory.status).toBe('won');
    expect(engine.actions).toBe(5);
    expect(engine.forward().messageKey).toBe('game-over');
    expect(engine.actions).toBe(5);
  });

  it('counts turns and does not wrap around the border', () => {
    const engine = makeEngine({ facing: 'S' });
    engine.turnLeft();
    engine.turnLeft();
    engine.turnLeft();
    engine.turnLeft();
    expect(engine.facing).toBe('S');
    expect(engine.actions).toBe(4);

    const bump = engine.forward();
    expect(bump.percepts.bump).toBeTrue();
    expect(engine.position).toEqual(START);
  });
});

function makeEngine(
  options: {
    facing?: 'N' | 'E' | 'S' | 'W';
    arrows?: number;
    pits?: { row: number; col: number }[];
    wumpus?: { row: number; col: number };
    gold?: { row: number; col: number };
  } = {},
): GameEngine {
  return new GameEngine({
    facing: options.facing,
    arrows: options.arrows ?? 1,
    board: createFixedBoard({
      size: 4,
      pits: options.pits ?? [{ row: 2, col: 2 }],
      wumpus: options.wumpus ?? { row: 2, col: 0 },
      gold: options.gold ?? { row: 3, col: 3 },
    }),
  });
}
