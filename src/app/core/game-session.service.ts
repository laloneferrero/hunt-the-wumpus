import { Injectable, computed, signal } from '@angular/core';
import { Rng } from './game/board';
import { buildBoardView, visitKey } from './game/board-view';
import { directionLabel } from './game/direction';
import { GameEngine } from './game/game-engine';
import { describePercepts, describeResult } from './game/messages';
import { Command, Direction, GameConfig, GameStatus } from './models/game.models';

const COMMAND_LABELS: Record<Command, string> = {
  forward: 'Avanzar',
  left: 'Girar a la izquierda',
  right: 'Girar a la derecha',
  shoot: 'Disparar',
  climb: 'Salir',
};

@Injectable({ providedIn: 'root' })
export class GameSessionService {
  private engine: GameEngine | null = null;
  private readonly revision = signal(0);
  private readonly visited = signal<ReadonlySet<string>>(new Set());

  readonly log = signal('');
  readonly status = signal<GameStatus | null>(null);
  readonly facing = signal<Direction | null>(null);
  readonly arrows = signal(0);
  readonly hasGold = signal(false);
  readonly actions = signal(0);
  readonly active = signal(false);
  readonly playing = computed(() => this.status() === 'playing');
  readonly size = computed(() => {
    this.revision();
    return this.engine?.board.size ?? 0;
  });
  readonly cells = computed(() => {
    this.revision();
    const engine = this.engine;
    if (!engine) {
      return [];
    }
    return buildBoardView({
      board: engine.board,
      position: engine.position,
      facing: engine.facing,
      visited: this.visited(),
    });
  });
  readonly facingLabel = computed(() => {
    const facing = this.facing();
    return facing ? directionLabel(facing) : '—';
  });

  start(config: GameConfig, rng?: Rng): void {
    this.load(GameEngine.fromConfig(config, rng));
  }

  load(engine: GameEngine): void {
    this.engine = engine;
    this.visited.set(new Set());
    this.sync();
    const intro = `Entras en la cueva por la casilla de salida, mirando al ${directionLabel(engine.facing)}.`;
    this.log.set([intro, describePercepts(engine.lastPercepts)].join('\n'));
  }

  command(command: Command): void {
    if (!this.engine || !this.playing()) {
      return;
    }
    const result = this.dispatch(this.engine, command);
    const lines = describeResult(result, this.engine.actions);
    const block = [`> ${COMMAND_LABELS[command]}`, ...lines].join('\n');
    this.log.update((current) => `${current}\n\n${block}`);
    this.sync();
  }

  clear(): void {
    this.engine = null;
    this.visited.set(new Set());
    this.log.set('');
    this.status.set(null);
    this.facing.set(null);
    this.arrows.set(0);
    this.hasGold.set(false);
    this.actions.set(0);
    this.active.set(false);
    this.revision.update((current) => current + 1);
  }

  private dispatch(engine: GameEngine, command: Command) {
    switch (command) {
      case 'forward':
        return engine.forward();
      case 'left':
        return engine.turnLeft();
      case 'right':
        return engine.turnRight();
      case 'shoot':
        return engine.shoot();
      case 'climb':
        return engine.climb();
    }
  }

  private sync(): void {
    const engine = this.engine;
    if (!engine) {
      return;
    }
    this.status.set(engine.status);
    this.facing.set(engine.facing);
    this.arrows.set(engine.arrows);
    this.hasGold.set(engine.hasGold);
    this.actions.set(engine.actions);
    this.active.set(true);
    this.visited.update((current) => {
      const key = visitKey(engine.position);
      if (current.has(key)) {
        return current;
      }
      const next = new Set(current);
      next.add(key);
      return next;
    });
    this.revision.update((current) => current + 1);
  }
}
