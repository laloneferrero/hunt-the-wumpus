import { Injectable, computed, signal } from '@angular/core';
import { Rng } from './game/board';
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

  readonly log = signal('');
  readonly status = signal<GameStatus | null>(null);
  readonly facing = signal<Direction | null>(null);
  readonly arrows = signal(0);
  readonly hasGold = signal(false);
  readonly actions = signal(0);
  readonly active = signal(false);
  readonly playing = computed(() => this.status() === 'playing');
  readonly facingLabel = computed(() => {
    const facing = this.facing();
    return facing ? directionLabel(facing) : '—';
  });

  start(config: GameConfig, rng?: Rng): void {
    this.load(GameEngine.fromConfig(config, rng));
  }

  load(engine: GameEngine): void {
    this.engine = engine;
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
    this.log.set('');
    this.status.set(null);
    this.facing.set(null);
    this.arrows.set(0);
    this.hasGold.set(false);
    this.actions.set(0);
    this.active.set(false);
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
  }
}
