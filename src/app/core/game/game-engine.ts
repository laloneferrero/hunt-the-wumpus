import { step, turnLeft, turnRight } from './direction';
import { Board, Rng, cellAt, generateBoard, inBounds, validateConfig, ConfigError } from './board';
import { perceive } from './perception';
import {
  ActionResult,
  DeathCause,
  Direction,
  GameConfig,
  GameStatus,
  MessageKey,
  Percepts,
  Position,
  START,
  samePosition,
} from '../models/game.models';

export interface EngineOptions {
  board: Board;
  arrows: number;
  facing?: Direction;
}

export class GameEngine {
  readonly board: Board;
  position: Position = { ...START };
  facing: Direction;
  arrows: number;
  hasGold = false;
  actions = 0;
  status: GameStatus = 'playing';
  deathCause?: DeathCause;
  lastPercepts: Percepts;

  constructor(options: EngineOptions) {
    this.board = options.board;
    this.arrows = options.arrows;
    this.facing = options.facing ?? 'E';
    this.lastPercepts = perceive(this.board, this.position);
  }

  static fromConfig(config: GameConfig, rng?: Rng): GameEngine {
    const error = validateConfig(config);
    if (error) {
      throw new ConfigError(error);
    }
    return new GameEngine({
      board: generateBoard(config, rng),
      arrows: config.arrows,
    });
  }

  forward(): ActionResult {
    if (this.status !== 'playing') {
      return this.rejected('game-over');
    }

    const next = step(this.position, this.facing);
    if (!inBounds(this.board, next)) {
      return this.accept({ bump: true, scream: false });
    }

    this.position = next;
    const cell = cellAt(this.board, this.position);
    if (cell.pit) {
      this.status = 'lost';
      this.deathCause = 'pit';
    } else if (cell.wumpus && this.board.wumpusAlive) {
      this.status = 'lost';
      this.deathCause = 'wumpus';
    }

    const collectedGold = this.collectGoldIfPresent();
    return this.accept({ bump: false, scream: false }, collectedGold);
  }

  turnLeft(): ActionResult {
    if (this.status !== 'playing') {
      return this.rejected('game-over');
    }
    this.facing = turnLeft(this.facing);
    return this.accept({ bump: false, scream: false });
  }

  turnRight(): ActionResult {
    if (this.status !== 'playing') {
      return this.rejected('game-over');
    }
    this.facing = turnRight(this.facing);
    return this.accept({ bump: false, scream: false });
  }

  shoot(): ActionResult {
    if (this.status !== 'playing') {
      return this.rejected('game-over');
    }
    if (this.arrows <= 0) {
      return this.rejected('no-arrows');
    }

    this.arrows -= 1;
    let cursor = step(this.position, this.facing);
    let hit = false;
    while (inBounds(this.board, cursor)) {
      const cell = cellAt(this.board, cursor);
      if (cell.wumpus && this.board.wumpusAlive) {
        this.board.wumpusAlive = false;
        hit = true;
        break;
      }
      cursor = step(cursor, this.facing);
    }

    return this.accept({ bump: false, scream: hit }, false, hit ? 'arrow-hit' : 'arrow-miss');
  }

  climb(): ActionResult {
    if (this.status !== 'playing') {
      return this.rejected('game-over');
    }
    if (!samePosition(this.position, START)) {
      return this.rejected('not-at-exit');
    }
    if (!this.hasGold) {
      return this.rejected('need-gold');
    }

    this.status = 'won';
    return this.accept({ bump: false, scream: false });
  }

  private collectGoldIfPresent(): boolean {
    if (this.status !== 'playing') {
      return false;
    }
    const cell = cellAt(this.board, this.position);
    if (!cell.gold || this.board.goldCollected) {
      return false;
    }
    this.board.goldCollected = true;
    this.hasGold = true;
    return true;
  }

  private accept(
    transient: { bump: boolean; scream: boolean },
    glitter = false,
    messageKey?: MessageKey,
  ): ActionResult {
    this.actions += 1;
    const percepts = perceive(this.board, this.position, transient);
    if (glitter) {
      percepts.glitter = true;
    }
    this.lastPercepts = percepts;
    return {
      ok: true,
      counted: true,
      percepts,
      status: this.status,
      deathCause: this.deathCause,
      messageKey,
    };
  }

  private rejected(messageKey: MessageKey): ActionResult {
    return {
      ok: false,
      counted: false,
      percepts: { ...this.lastPercepts, bump: false, scream: false },
      status: this.status,
      deathCause: this.deathCause,
      messageKey,
    };
  }
}
