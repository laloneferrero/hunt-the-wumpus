import { ActionResult, Percepts } from '../models/game.models';

export function describePercepts(percepts: Percepts): string {
  const parts: string[] = [];
  if (percepts.wumpus) {
    parts.push('el Wumpus está aquí');
  }
  if (percepts.stench) {
    parts.push('hedor');
  }
  if (percepts.breeze) {
    parts.push('brisa');
  }
  if (percepts.glitter) {
    parts.push('brillo');
  }
  if (percepts.bump) {
    parts.push('choque');
  }
  if (percepts.scream) {
    parts.push('grito');
  }
  if (parts.length === 0) {
    return 'No percibes nada.';
  }
  return `Percibes: ${parts.join(', ')}.`;
}

export function describeResult(result: ActionResult, actions: number): string[] {
  switch (result.messageKey) {
    case 'game-over':
      return ['La partida ha terminado.'];
    case 'no-arrows':
      return ['No te quedan flechas.'];
    case 'not-at-exit':
      return ['Solo puedes salir desde la casilla de salida.'];
    case 'need-gold':
      return ['Aún no tienes el lingote de oro.'];
    default:
      break;
  }

  const lines = [describePercepts(result.percepts)];
  if (result.percepts.glitter) {
    lines.push('Recoges el lingote de oro.');
  }
  if (result.percepts.bump) {
    lines.push('Chocas contra un muro.');
  }
  if (result.deathCause === 'pit') {
    lines.push('Caes en un pozo sin fondo. Has muerto.');
  }
  if (result.deathCause === 'wumpus') {
    lines.push('El Wumpus te devora. Has muerto.');
  }
  if (result.messageKey === 'arrow-miss') {
    lines.push('La flecha choca contra el muro.');
  }
  if (result.messageKey === 'arrow-hit') {
    lines.push('Oyes un grito agónico. El Wumpus ha muerto.');
  }
  if (result.status === 'won') {
    lines.push(`Sales con el oro. Victoria en ${actions} acciones.`);
  }
  return lines;
}
