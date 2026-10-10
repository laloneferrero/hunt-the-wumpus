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

    clickButton(fixture.nativeElement, 'Avanzar');
    clickButton(fixture.nativeElement, 'Izquierda');
    clickButton(fixture.nativeElement, 'Derecha');
    clickButton(fixture.nativeElement, 'Disparar');
    clickButton(fixture.nativeElement, 'Salir');
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

    clickButton(fixture.nativeElement, 'Avanzar');
    fixture.detectChanges();

    expect(logText(fixture.nativeElement)).toContain('Has muerto.');
    expect(button(fixture.nativeElement, 'Avanzar').disabled).toBeTrue();
    expect(button(fixture.nativeElement, 'Salir').disabled).toBeTrue();

    const before = session.log();
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

    clickButton(fixture.nativeElement, 'Avanzar');
    clickButton(fixture.nativeElement, 'Izquierda');
    clickButton(fixture.nativeElement, 'Izquierda');
    clickButton(fixture.nativeElement, 'Avanzar');
    clickButton(fixture.nativeElement, 'Salir');
    fixture.detectChanges();

    expect(logText(fixture.nativeElement)).toContain('Victoria en 5 acciones.');
    expect(button(fixture.nativeElement, 'Avanzar').disabled).toBeTrue();
    expect(session.hasGold()).toBeTrue();
    expect(session.status()).toBe('won');
  });
});

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
