import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { createFixedBoard } from '../../core/game/board';
import { GameEngine } from '../../core/game/game-engine';
import { GameSessionService } from '../../core/game-session.service';
import { PlayComponent } from './play.component';

describe('PlayComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('returns to the setup screen when there is no game', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);

    const fixture = TestBed.createComponent(PlayComponent);
    fixture.detectChanges();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('writes every command into the log', () => {
    const session = TestBed.inject(GameSessionService);
    session.load(
      new GameEngine({
        arrows: 1,
        board: createFixedBoard({
          size: 4,
          pits: [{ row: 3, col: 3 }],
          wumpus: { row: 3, col: 2 },
          gold: { row: 3, col: 1 },
        }),
      }),
    );
    const fixture = TestBed.createComponent(PlayComponent);
    fixture.detectChanges();

    press('ArrowUp');
    press('ArrowLeft');
    press('ArrowRight');
    press('Space');
    press('Enter');
    fixture.detectChanges();

    const log = logText(fixture.nativeElement);
    expect(log).toContain('> Avanzar');
    expect(log).toContain('> Girar a la izquierda');
    expect(log).toContain('> Girar a la derecha');
    expect(log).toContain('> Disparar');
    expect(log).toContain('> Salir');
    expect(log).toContain('Solo puedes salir desde la casilla de salida.');
    expect(session.actions()).toBe(4);
  });

  it('stops accepting commands after the hunter dies', () => {
    const session = TestBed.inject(GameSessionService);
    session.load(
      new GameEngine({
        arrows: 1,
        board: createFixedBoard({
          size: 4,
          pits: [{ row: 0, col: 1 }],
          wumpus: { row: 3, col: 3 },
          gold: { row: 3, col: 2 },
        }),
      }),
    );
    const fixture = TestBed.createComponent(PlayComponent);
    fixture.detectChanges();

    press('ArrowUp');
    fixture.detectChanges();

    expect(logText(fixture.nativeElement)).toContain('Has muerto.');
    expect(button(fixture.nativeElement, 'Disparar').disabled).toBeTrue();
    expect(button(fixture.nativeElement, 'Salir').disabled).toBeTrue();

    const before = session.log();
    press('ArrowUp');
    press('Space');
    fixture.componentInstance.act('forward');
    fixture.detectChanges();
    expect(session.log()).toBe(before);
    expect(session.actions()).toBe(1);
  });

  it('stops accepting commands after a victory', () => {
    const session = TestBed.inject(GameSessionService);
    session.load(
      new GameEngine({
        arrows: 1,
        board: createFixedBoard({
          size: 4,
          pits: [{ row: 3, col: 3 }],
          wumpus: { row: 3, col: 2 },
          gold: { row: 0, col: 1 },
        }),
      }),
    );
    const fixture = TestBed.createComponent(PlayComponent);
    fixture.detectChanges();

    press('ArrowUp');
    press('ArrowLeft');
    press('ArrowLeft');
    press('ArrowUp');
    press('Enter');
    fixture.detectChanges();

    expect(logText(fixture.nativeElement)).toContain('Victoria en 5 acciones.');
    expect(button(fixture.nativeElement, 'Salir').disabled).toBeTrue();
    expect(session.hasGold()).toBeTrue();
    expect(session.status()).toBe('won');
  });

  it('shows breeze and stench on the start square and hides unseen hazards', () => {
    const fixture = startCave({
      pits: [{ row: 0, col: 1 }],
      wumpus: { row: 1, col: 0 },
      gold: { row: 3, col: 3 },
    });

    const board = boardText(fixture.nativeElement);
    expect(board).toContain('💨');
    expect(board).toContain('🤢');
    expect(board).not.toContain('👽');
    expect(board).not.toContain('🕳️');
    expect(fixture.nativeElement.querySelectorAll('.square').length).toBe(16);
    expect(fixture.nativeElement.querySelector('.hunter')?.getAttribute('data-facing')).toBe('E');

    press('ArrowLeft');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.hunter')?.getAttribute('data-facing')).toBe('N');
  });

  it('shows the pit emoji only after falling in', () => {
    const fixture = startCave({
      pits: [{ row: 0, col: 1 }],
      wumpus: { row: 3, col: 3 },
      gold: { row: 3, col: 2 },
    });

    expect(boardText(fixture.nativeElement)).not.toContain('🕳️');
    press('ArrowUp');
    fixture.detectChanges();
    expect(boardText(fixture.nativeElement)).toContain('🕳️');
  });

  it('shows the alien emoji when the hunter finds the wumpus', () => {
    const fixture = startCave({
      pits: [{ row: 3, col: 3 }],
      wumpus: { row: 1, col: 0 },
      gold: { row: 3, col: 2 },
    });

    expect(boardText(fixture.nativeElement)).not.toContain('👽');
    press('ArrowLeft');
    press('ArrowUp');
    fixture.detectChanges();
    expect(boardText(fixture.nativeElement)).toContain('👽');
  });

  it('keeps shoot and climb on screen and ignores a held spacebar', () => {
    const session = TestBed.inject(GameSessionService);
    const fixture = startCave({
      pits: [{ row: 3, col: 3 }],
      wumpus: { row: 3, col: 2 },
      gold: { row: 3, col: 1 },
    });

    expect(fixture.nativeElement.textContent).not.toContain('Avanzar');
    clickButton(fixture.nativeElement, 'Disparar');
    press('Space', true);
    clickButton(fixture.nativeElement, 'Salir');
    fixture.detectChanges();

    const log = logText(fixture.nativeElement);
    expect(log).toContain('> Disparar');
    expect(log).toContain('> Salir');
    expect(session.arrows()).toBe(0);
    expect(session.actions()).toBe(1);
  });
});

function startCave(layout: {
  pits: { row: number; col: number }[];
  wumpus: { row: number; col: number };
  gold: { row: number; col: number };
}) {
  const session = TestBed.inject(GameSessionService);
  session.load(
    new GameEngine({
      arrows: 1,
      board: createFixedBoard({ size: 4, ...layout }),
    }),
  );
  const fixture = TestBed.createComponent(PlayComponent);
  fixture.detectChanges();
  return fixture;
}

function press(code: string, repeat = false): void {
  const key = code === 'Space' ? ' ' : code;
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key, code, repeat, bubbles: true, cancelable: true }),
  );
}

function button(root: HTMLElement, label: string): HTMLButtonElement {
  const found = [...root.querySelectorAll('button')].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!found) {
    throw new Error(`Missing button ${label}`);
  }
  return found as HTMLButtonElement;
}

function clickButton(root: HTMLElement, label: string): void {
  button(root, label).click();
}

function logText(root: HTMLElement): string {
  return (root.querySelector('textarea') as HTMLTextAreaElement).value;
}

function boardText(root: HTMLElement): string {
  return root.querySelector('.board')?.textContent ?? '';
}
