# Cómo funciona el juego

Documento para quien vaya a cambiar reglas, tablero o pantallas. Las reglas viven en `src/app/core` y no dependen de Angular. La interfaz solo lee el estado y envía comandos.

## Recorrido de una acción

1. `SetupComponent.start()` valida el formulario y llama a `GameSessionService.start()`.
2. `GameEngine.fromConfig()` genera el tablero y deja al cazador en la salida, mirando al Este.
3. En `/jugar`, el teclado o los botones llaman a `PlayComponent.act()`.
4. `GameSessionService.command()` traduce el comando a un método del motor.
5. El motor devuelve un `ActionResult`. El servicio lo convierte en líneas de texto y refresca las señales que pinta la pantalla.

```text
tecla o botón
  -> PlayComponent.act
  -> GameSessionService.command
  -> GameEngine.forward | turnLeft | turnRight | shoot | climb
  -> describeResult
  -> señales (log, celdas, flechas, oro, acciones)
```

Si la partida no está en `playing`, el componente y el servicio ignoran el comando. El motor, si se llama igual, responde con `ok: false` y `messageKey: 'game-over'`.

## Coordenadas

`Position` es `{ row, col }`. La fila 0 es el sur del tablero y la columna 0 es el oeste. Norte suma una fila; este suma una columna.

La salida es `START`: `{ row: 0, col: 0 }`. En pantalla esa casilla queda abajo a la izquierda, porque `buildBoardView` recorre las filas de mayor a menor. El cazador empieza mirando al Este (`E`).

La salida nunca tiene pozo, Wumpus ni oro.

## Reglas que aplica el motor

- Avanzar dentro del tablero mueve una casilla en la dirección actual. Contra el borde no mueve y marca choque.
- Entrar en un pozo, o en la casilla del Wumpus vivo, pone `status` en `lost`.
- Entrar en la casilla del oro lo recoge. El brillo solo existe en esa acción.
- Girar no cambia de casilla.
- La flecha sale de la casilla de enfrente y sigue en línea recta. Se detiene en el Wumpus vivo o al salir del tablero. Matarlo pone `wumpusAlive` en `false` y el hedor desaparece. No hace falta matarlo para ganar.
- Salir solo cuenta en la casilla de salida y solo si ya se recogió el oro. Entonces `status` pasa a `won`.
- Un avance, giro o disparo aceptado suma una acción, también si hay choque o la flecha falla. Un rechazo (sin flechas, salir fuera de la salida, salir sin oro, partida terminada) no suma.

## Mapa de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `src/app/core/models/game.models.ts` | Tipos y constantes compartidas |
| `src/app/core/game/direction.ts` | Giros y un paso en una dirección |
| `src/app/core/game/board.ts` | Validar la configuración y colocar las piezas |
| `src/app/core/game/perception.ts` | Qué se siente en una casilla |
| `src/app/core/game/game-engine.ts` | Estado de la partida y comandos |
| `src/app/core/game/messages.ts` | Texto del registro |
| `src/app/core/game/board-view.ts` | Casillas listas para pintar |
| `src/app/core/game-session.service.ts` | Sesión de Angular: señales, registro y visitas |
| `src/app/features/setup/` | Formulario inicial, ruta `/` |
| `src/app/features/play/` | Tablero y controles, ruta `/jugar` |

Los tests están junto a cada módulo (`*.spec.ts`). Para un tablero fijo usan `createFixedBoard`. Para uno aleatorio repetible usan `mulberry32(semilla)`.

## Modelos

`src/app/core/models/game.models.ts`

| Símbolo | Qué es |
| --- | --- |
| `Direction` | `'N' \| 'E' \| 'S' \| 'W'` |
| `Command` | `'forward' \| 'left' \| 'right' \| 'shoot' \| 'climb'` |
| `GameStatus` | `'playing' \| 'won' \| 'lost'` |
| `DeathCause` | `'pit' \| 'wumpus'` |
| `MessageKey` | Motivo de un rechazo o del resultado de la flecha |
| `GameConfig` | `size`, `pits` y `arrows` que elige el jugador |
| `Percepts` | Hedor, brisa, brillo, choque, grito y si el Wumpus está en la casilla |
| `ActionResult` | Resultado de un comando: `ok`, `counted`, percepciones, estado y mensaje |
| `samePosition` | Compara fila y columna |
| `emptyPercepts` | Todas las percepciones en `false` |
| `START` | `{ row: 0, col: 0 }` |
| `MIN_SIZE`, `MAX_SIZE` | 3 y 12 |
| `DEFAULT_SIZE`, `DEFAULT_PITS`, `DEFAULT_ARROWS` | 4, 2 y 1 |

## Dirección

`src/app/core/game/direction.ts`

El orden de giro es `N -> E -> S -> W`.

| Función | Qué hace |
| --- | --- |
| `turnLeft` | Un giro de 90° a la izquierda |
| `turnRight` | Un giro de 90° a la derecha |
| `step` | La casilla siguiente en esa dirección, sin mirar si cabe en el tablero |
| `directionLabel` | `Norte`, `Este`, `Sur` u `Oeste` para la interfaz y el registro |

## Tablero

`src/app/core/game/board.ts`

Una `Cell` tiene tres booleanos: `pit`, `wumpus`, `gold`. Un `Board` guarda la matriz `cells[fila][columna]`, el tamaño, si el Wumpus sigue vivo y si el oro ya se recogió.

| Función | Qué hace |
| --- | --- |
| `validateConfig` | Devuelve un mensaje de error, o `null` si la configuración es jugable. El tamaño es un entero de 3 a 12. Pozos y flechas son enteros `>= 0`. Pozos, Wumpus y oro tienen que caber en el resto de casillas (`size² - 1`) |
| `emptyCell` | Casilla sin piezas |
| `createFixedBoard` | Matriz vacía y luego marca las posiciones dadas. Falla si una pieza cae fuera, en la salida o encima de otra |
| `generateBoard` | Valida, lista todas las casillas menos la salida, las baraja y asigna `free[0]` al Wumpus, `free[1]` al oro y las siguientes a los pozos |
| `mulberry32` | Generador aleatorio con semilla. Lo usan los tests para repetir el mismo tablero |
| `inBounds` | Si la posición está dentro del tablero |
| `cellAt` | La celda de esa posición |
| `neighbors` | Arriba, abajo, izquierda y derecha que sigan dentro del tablero. No hay diagonales |

`shuffle` es interna: baraja in-place con el algoritmo de Fisher-Yates.

## Percepción

`src/app/core/game/perception.ts`

`perceive(board, position, transient?)` mira la casilla y sus vecinas:

| Campo | Cuándo es `true` |
| --- | --- |
| `stench` | Un vecino tiene al Wumpus y `wumpusAlive` sigue en `true` |
| `breeze` | Un vecino tiene un pozo |
| `glitter` | Esta casilla tiene oro y aún no se ha recogido. El motor lo apaga en la misma acción y lo fuerza otra vez en el resultado para que el registro lo cuente una sola vez |
| `bump` | El comando trae choque. No se guarda en el tablero |
| `scream` | El comando trae grito. No se guarda en el tablero |
| `wumpus` | El Wumpus vivo está en esta casilla |

## Motor

`src/app/core/game/game-engine.ts`

`GameEngine` guarda posición, orientación, flechas, si tiene el oro, acciones, estado, causa de muerte y la última percepción.

| Método | Qué hace |
| --- | --- |
| `constructor` | Recibe un tablero ya armado, las flechas y, si no se indica, orientación Este. Calcula la percepción inicial |
| `fromConfig` | Valida, genera el tablero y construye el motor. Es el camino de una partida nueva |
| `forward` | Avanza, choca, muere o recoge el oro, según la casilla de destino |
| `turnLeft` | Gira a la izquierda y cuenta la acción |
| `turnRight` | Gira a la derecha y cuenta la acción |
| `shoot` | Gasta una flecha y recorre la línea de frente. Sin flechas no cuenta la acción |
| `climb` | Gana solo en la salida y con el oro. Fuera de la salida o sin oro no cuenta la acción |
| `collectGoldIfPresent` | Privado. Marca el oro como recogido si el cazador sigue vivo en esa casilla |
| `accept` | Privado. Suma una acción, recalcula percepciones y devuelve `ok: true`, `counted: true` |
| `rejected` | Privado. No cambia el contador y devuelve `ok: false`, `counted: false` con el `messageKey` indicado |

`glitter` del resultado no sale solo de `perceive` después de recoger: `collectGoldIfPresent` ya dejó `goldCollected` en `true`, así que `accept` vuelve a poner `percepts.glitter` cuando esa acción fue la que lo recogió.

## Texto del registro

`src/app/core/game/messages.ts`

| Función | Qué hace |
| --- | --- |
| `describePercepts` | Una frase. Sin nada que reportar: «No percibes nada.» Si hay varias, van en este orden: Wumpus aquí, hedor, brisa, brillo, choque, grito |
| `describeResult` | Líneas que se añaden bajo el comando. Un rechazo devuelve solo su frase. Una acción aceptada empieza por las percepciones y puede añadir recogida del oro, choque, muerte, fallo o acierto de la flecha, y la victoria con el número de acciones |

## Vista del tablero

`src/app/core/game/board-view.ts`

`buildBoardView` devuelve un array plano, fila alta primero y columnas de izquierda a derecha. CSS lo pinta en ese orden, así que la fila 0 queda abajo.

Cada `BoardCellView` lleva:

| Campo | Qué es |
| --- | --- |
| `id` | `"fila,columna"`, también lo produce `visitKey` |
| `light` | Casilla clara del damero cuando `(fila + columna)` es par |
| `visited` | El cazador ya pisó esa casilla |
| `here` | El cazador está aquí |
| `facing` | Orientación si está aquí; si no, `null` |
| `icons` | Emojis visibles |
| `label` | Texto para el lector de pantalla. Las filas y columnas que dice son `índice + 1` |

`iconsFor` no muestra nada en una casilla no visitada. En una visitada puede mostrar:

| Icono | Condición |
| --- | --- |
| 🕳️ | La casilla es un pozo |
| 👽 | La casilla tiene al Wumpus, vivo o muerto |
| 💨 | Hay brisa |
| 🤢 | Hay hedor |
| 🚪 | Es la salida y el cazador no está encima |

El oro no tiene icono en el tablero.

## Sesión

`src/app/core/game-session.service.ts`

`GameSessionService` es un singleton. Traduce el motor a señales de Angular.

| Miembro | Qué hace |
| --- | --- |
| `start` | Crea el motor con `fromConfig` y llama a `load` |
| `load` | Sustituye el motor, vacía las casillas visitadas, sincroniza y escribe la frase de entrada más la percepción inicial |
| `command` | Ejecuta el comando, añade al registro el rótulo (`Avanzar`, `Girar a la izquierda`, `Girar a la derecha`, `Disparar`, `Salir`) y las líneas de `describeResult`, y sincroniza |
| `clear` | Borra motor, registro y señales. Lo usa «Nueva partida» |
| `dispatch` | Privado. Pasa de `Command` al método del motor |
| `sync` | Privado. Copia estado, orientación, flechas, oro y acciones. Marca la casilla actual como visitada e incrementa `revision` para que `size` y `cells` se recalculen |
| `playing` | `status === 'playing'` |
| `cells` | El array de `buildBoardView` |
| `facingLabel` | Orientación en español, o `—` si no hay partida |

`revision` existe porque la posición y el tablero del motor no son señales. Cada `sync` obliga a recomputar la vista.

## Pantallas

### Configuración

`SetupComponent` (`/`). El formulario usa los valores por defecto del modelo. `readConfig` convierte los campos a números. `start` llama a `validateConfig`: si hay error lo muestra y no navega; si no, `session.start(config)` y navega a `/jugar`.

### Partida

`PlayComponent` (`/jugar`). Si `session.active()` es falso, vuelve a `/`.

| Método | Qué hace |
| --- | --- |
| `onKeydown` | Traduce la tecla a un comando. `ArrowUp` avanza, `ArrowLeft` gira a la izquierda, `ArrowRight` gira a la derecha, `Enter` y `NumpadEnter` salen, `Space` dispara. Fuera de una partida en curso no intercepta la tecla. Si la partida sigue, evita el comportamiento del navegador. Mantener pulsado Enter o Espacio no repite el comando |
| `act` | Si se está jugando, envía el comando y baja el scroll del registro hasta el final |
| `newGame` | `session.clear()` y vuelve a `/` |

La plantilla pinta `session.cells()`. El cazador es un sprite cuyo fotograma vertical depende de `data-facing`. Disparar y Salir siguen como botones y llaman a `act('shoot')` y `act('climb')`.

## Qué contar y qué no

Cuenta como acción: avanzar (aunque choque), girar, disparar y acertar o fallar, y salir con el oro.

No cuenta: disparar sin flechas, salir fuera de la salida, salir sin oro, y cualquier comando con la partida ya ganada o perdida.
