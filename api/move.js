import { TomarMovimiento, BOARD_LENGTH } from '../tateti.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const boardParam = req.query.board;

    if (!boardParam) {
      return res.status(400).json({ error: 'Parámetro "board" requerido' });
    }

    const board = JSON.parse(boardParam);

    if (!Array.isArray(board) || board.length !== BOARD_LENGTH) {
      return res.status(400).json({
        error: `El tablero debe ser un array de ${BOARD_LENGTH} posiciones`
      });
    }

    const validValues = board.every(cell => [0, 1, 2].includes(cell));
    if (!validValues) {
      return res.status(400).json({
        error: 'El tablero solo puede contener valores 0, 1 o 2'
      });
    }

    const move = TomarMovimiento(board);

    if (move === -1) {
      return res.status(400).json({ error: 'No hay movimientos disponibles' });
    }

    return res.status(200).json({
      movimiento: move,
      tablero: board,
      mensaje: `Movimiento en posición ${move}`
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Error interno',
      detalle: err.message
    });
  }
}
