# Hunt the Wumpus

Cazador en una cueva de `n × n` celdas. El oro brilla, los pozos dejan brisa y el Wumpus huele en las casillas adyacentes (arriba, abajo, izquierda y derecha). Toda la partida ocurre en el navegador: no hay servidor.

## Requisitos

- Node.js 22.22.3 o superior (Angular 22 también admite Node 24.15+ o 26+)
- npm 10
- Google Chrome, para los tests con Karma en modo headless

## Ejecutar

```bash
npm install
npm start
```

La aplicación queda en http://localhost:4200.

1. En la primera pantalla elige el tamaño del tablero, el número de pozos y las flechas.
2. En la segunda pantalla usa Avanzar, Izquierda, Derecha, Disparar y Salir. La caja de texto muestra lo que percibe el cazador.

## Tests

```bash
npm test
```

Equivalente:

```bash
npx ng test --no-watch --browsers=ChromeHeadless
```

## Reglas

- La salida es la casilla donde empieza el cazador, mirando al Este. Esa casilla no tiene pozo, Wumpus ni oro.
- Hay un Wumpus y un lingote. Los pozos, el Wumpus y el oro ocupan celdas distintas.
- Avanzar contra el borde no mueve al cazador y se percibe el choque.
- Entrar en un pozo, o en la celda del Wumpus vivo, mata al cazador.
- La flecha viaja en línea recta hasta el Wumpus vivo o hasta el muro. Si lo mata, se oye un grito y el hedor desaparece.
- Al entrar en la celda del oro se recoge. El brillo solo se percibe en ese momento.
- Salir solo es posible en la casilla de salida. Sin el oro la partida sigue. Con el oro se gana y se muestra el número de acciones.
- Cada avance, giro o disparo aceptado cuenta como una acción, también si hay choque o la flecha falla.

Valores por defecto: tablero 4×4, 2 pozos y 1 flecha. El tamaño admite enteros de 3 a 12, y los pozos más el Wumpus y el oro tienen que caber en el resto de celdas.
