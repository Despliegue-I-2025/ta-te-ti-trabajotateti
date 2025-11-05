const express = require('express');
const app = express();

// ===============================
// 🔹 Configuración del Juego 5x5
// ===============================
const BOARD_SIZE = 5;
const WIN_COUNT = 4;
const BOARD_LENGTH = BOARD_SIZE * BOARD_SIZE;
const CENTER_POSITION = Math.floor(BOARD_LENGTH / 2);

const BOT_nuestro = 1;
const Bot_oponente = 2;
const EMPTY = 0;

// ===============================
// 🔹 Utilidades de Tablero
// ===============================
function cell(board, r, c) {
  return board[r * BOARD_SIZE + c];
}

function checkWinner(board) {
  // Horizontal
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c <= BOARD_SIZE - WIN_COUNT; c++) {
      const first = cell(board, r, c);
      if (
        first &&
        Array.from({ length: WIN_COUNT }, (_, k) => cell(board, r, c + k)).every(v => v === first)
      ) return first;
    }
  }

  // Vertical
  for (let c = 0; c < BOARD_SIZE; c++) {
    for (let r = 0; r <= BOARD_SIZE - WIN_COUNT; r++) {
      const first = cell(board, r, c);
      if (
        first &&
        Array.from({ length: WIN_COUNT }, (_, k) => cell(board, r + k, c)).every(v => v === first)
      ) return first;
    }
  }

  // Diagonal ↘
  for (let r = 0; r <= BOARD_SIZE - WIN_COUNT; r++) {
    for (let c = 0; c <= BOARD_SIZE - WIN_COUNT; c++) {
      const first = cell(board, r, c);
      if (
        first &&
        Array.from({ length: WIN_COUNT }, (_, k) => cell(board, r + k, c + k)).every(v => v === first)
      ) return first;
    }
  }

  // Diagonal ↙
  for (let r = 0; r <= BOARD_SIZE - WIN_COUNT; r++) {
    for (let c = WIN_COUNT - 1; c < BOARD_SIZE; c++) {
      const first = cell(board, r, c);
      if (
        first &&
        Array.from({ length: WIN_COUNT }, (_, k) => cell(board, r + k, c - k)).every(v => v === first)
      ) return first;
    }
  }

  return board.includes(EMPTY) ? null : 0;
}

function detectPlayer(board) {
  const x = board.filter(v => v === BOT_nuestro).length;
  const o = board.filter(v => v === Bot_oponente).length;
  return x <= o ? BOT_nuestro : Bot_oponente;
}

// ===============================
// 🔹 Heurística y Minimax (simplificado)
// ===============================
function evaluateLine(line, player) {
  const opponent = player === BOT_nuestro ? Bot_oponente : BOT_nuestro;
  const pCount = line.filter(v => v === player).length;
  const oCount = line.filter(v => v === opponent).length;

  if (pCount > 0 && oCount > 0) return 0;
  if (pCount === WIN_COUNT) return 10000;
  if (oCount === WIN_COUNT) return -10000;

  return pCount * pCount - oCount * oCount;
}

function evaluateBoard(board, player) {
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c <= BOARD_SIZE - WIN_COUNT; c++) {
      // Horizontal
      score += evaluateLine(Array.from({ length: WIN_COUNT }, (_, k) => cell(board, r, c + k)), player);
      // Vertical
      if (r <= BOARD_SIZE - WIN_COUNT) {
        score += evaluateLine(Array.from({ length: WIN_COUNT }, (_, k) => cell(board, r + k, c)), player);
      }
    }
  }
  return score;
}

function minimax(board, depth, isMax, player, alpha, beta, maxDepth = 3) {
  const opponent = player === BOT_nuestro ? Bot_oponente : BOT_nuestro;
  const result = checkWinner(board);

  if (result === player) return 1000 - depth;
  if (result === opponent) return depth - 1000;
  if (result === 0 || depth === maxDepth) return evaluateBoard(board, player);

  const moves = board.map((v, i) => v === EMPTY ? i : -1).filter(i => i !== -1);

  if (isMax) {
    let best = -Infinity;
    for (const move of moves) {
      board[move] = player;
      const score = minimax(board, depth + 1, false, player, alpha, beta, maxDepth);
      board[move] = EMPTY;
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      board[move] = opponent;
      const score = minimax(board, depth + 1, true, player, alpha, beta, maxDepth);
      board[move] = EMPTY;
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ===============================
// 🔹 Función principal del Bot
// ===============================
function TomarMovimiento(board) {
  const isEmpty = board.every(cell => cell === 0);
  if (isEmpty) return CENTER_POSITION;

  const player = detectPlayer(board);

  // 1. Movimiento ganador
  for (let i = 0; i < BOARD_LENGTH; i++) {
    if (board[i] === EMPTY) {
      board[i] = player;
      if (checkWinner(board) === player) {
        board[i] = EMPTY;
        return i;
      }
      board[i] = EMPTY;
    }
  }

  // 2. Bloquear al oponente
  const opponent = player === BOT_nuestro ? Bot_oponente : BOT_nuestro;
  for (let i = 0; i < BOARD_LENGTH; i++) {
    if (board[i] === EMPTY) {
      board[i] = opponent;
      if (checkWinner(board) === opponent) {
        board[i] = EMPTY;
        return i;
      }
      board[i] = EMPTY;
    }
  }

  // 3. Centro
  if (board[CENTER_POSITION] === EMPTY) return CENTER_POSITION;

  // 4. Minimax
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < BOARD_LENGTH; i++) {
    if (board[i] === EMPTY) {
      board[i] = player;
      const score = minimax(board, 0, false, player, -Infinity, Infinity, 2);
      board[i] = EMPTY;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  if (bestMove === -1) bestMove = board.findIndex(cell => cell === EMPTY);
  return bestMove;
}

// ===============================
// 🔹 Endpoint /move
// ===============================
app.get('/move', (req, res) => {
  try {
    const boardParam = req.query.board;

    // Si no se pasa tablero, usar uno vacío
    const board = boardParam ? JSON.parse(boardParam) : Array(BOARD_LENGTH).fill(0);

    if (!Array.isArray(board) || board.length !== BOARD_LENGTH) {
      return res.status(400).json({
        error: `El tablero debe ser un array de ${BOARD_LENGTH} posiciones`
      });
    }

    const validValues = board.every(cell => [EMPTY, BOT_nuestro, Bot_oponente].includes(cell));
    if (!validValues) {
      return res.status(400).json({
        error: 'El tablero solo puede contener valores 0, 1 o 2'
      });
    }

    const move = TomarMovimiento(board);
    if (move === -1) {
      return res.status(400).json({ error: 'No hay movimientos disponibles' });
    }

    return res.json({
      movimiento: move,
      mensaje: `Movimiento en posición ${move}`,
      tablero: board
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
});

// ===============================
// 🔹 Manejo de rutas no válidas
// ===============================
app.use('*', (req, res) => {
  return res.status(404).json({
    error: 'Endpoint no encontrado',
    endpoints_disponibles: ['/move']
  });
});

// ===============================
// 🔹 Servidor local (solo si se ejecuta directamente)
// ===============================
if (require.main === module) {
  const PORT = process.env.PORT || 3020;
  app.listen(PORT, () => {
    console.log(`Servidor local escuchando en http://localhost:${PORT}`);
    console.log(`Probar con: http://localhost:${PORT}/move`);
  });
}

// ===============================
// 🔹 Exportación para Vercel y tests
// ===============================
module.exports = app;
module.exports.TomarMovimiento = TomarMovimiento;
module.exports.checkWinner = checkWinner;
module.exports.BOT_nuestro = BOT_nuestro;
module.exports.Bot_oponente = Bot_oponente;
module.exports.BOARD_LENGTH = BOARD_LENGTH;
module.exports.WIN_COUNT = WIN_COUNT;
module.exports.CENTER_POSITION = CENTER_POSITION;
