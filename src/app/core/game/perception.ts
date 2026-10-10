import { Percepts, Position } from '../models/game.models';
import { Board, cellAt, neighbors } from './board';

export function perceive(
  board: Board,
  position: Position,
  transient: { bump: boolean; scream: boolean } = { bump: false, scream: false },
): Percepts {
  const cell = cellAt(board, position);
  const around = neighbors(board, position);
  return {
    stench: board.wumpusAlive && around.some((next) => cellAt(board, next).wumpus),
    breeze: around.some((next) => cellAt(board, next).pit),
    glitter: cell.gold && !board.goldCollected,
    bump: transient.bump,
    scream: transient.scream,
    wumpus: cell.wumpus && board.wumpusAlive,
  };
}
