import { describePercepts, describeResult } from './messages';
import { ActionResult, emptyPercepts } from '../models/game.models';

describe('messages', () => {
  it('says when the hunter perceives nothing', () => {
    expect(describePercepts(emptyPercepts())).toBe('No percibes nada.');
  });

  it('lists the percepts of the current cell', () => {
    expect(
      describePercepts({
        ...emptyPercepts(),
        stench: true,
        breeze: true,
        glitter: true,
        bump: true,
        scream: true,
      }),
    ).toBe('Percibes: hedor, brisa, brillo, choque, grito.');
  });

  it('describes death, the scream and the victory', () => {
    expect(describeResult(result({ deathCause: 'pit', status: 'lost' }), 3)).toContain(
      'Caes en un pozo sin fondo. Has muerto.',
    );
    expect(
      describeResult(result({ deathCause: 'wumpus', status: 'lost', wumpus: true }), 2),
    ).toContain('El Wumpus te devora. Has muerto.');
    expect(describeResult(result({ messageKey: 'arrow-hit', scream: true }), 1)).toContain(
      'Oyes un grito agónico. El Wumpus ha muerto.',
    );
    expect(describeResult(result({ status: 'won' }), 7)).toContain(
      'Sales con el oro. Victoria en 7 acciones.',
    );
  });

  it('explains rejected actions', () => {
    expect(describeResult(result({ ok: false, messageKey: 'need-gold' }), 0)).toEqual([
      'Aún no tienes el lingote de oro.',
    ]);
    expect(describeResult(result({ ok: false, messageKey: 'no-arrows' }), 0)).toEqual([
      'No te quedan flechas.',
    ]);
    expect(describeResult(result({ ok: false, messageKey: 'not-at-exit' }), 0)).toEqual([
      'Solo puedes salir desde la casilla de salida.',
    ]);
  });

  it('announces when the gold is picked up', () => {
    expect(describeResult(result({ glitter: true }), 1)).toContain('Recoges el lingote de oro.');
  });
});

function result(
  partial: {
    ok?: boolean;
    status?: ActionResult['status'];
    messageKey?: ActionResult['messageKey'];
    deathCause?: ActionResult['deathCause'];
    glitter?: boolean;
    scream?: boolean;
    wumpus?: boolean;
  } = {},
): ActionResult {
  return {
    ok: partial.ok ?? true,
    counted: partial.ok ?? true,
    status: partial.status ?? 'playing',
    messageKey: partial.messageKey,
    deathCause: partial.deathCause,
    percepts: {
      ...emptyPercepts(),
      glitter: partial.glitter ?? false,
      scream: partial.scream ?? false,
      wumpus: partial.wumpus ?? false,
    },
  };
}
