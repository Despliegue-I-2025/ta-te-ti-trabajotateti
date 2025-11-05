const express = require('express');
const app = express();

// Constantes del juego
const BOARD_LENGTH = 25;
const EMPTY = 0;

// Lógica mínima del bot
function TomarMovimiento(board) {
    for (let i = 0; i < BOARD_LENGTH; i++) {
        if (board[i] === EMPTY) {
            return i;
        }
    }
    return -1;
}

// Endpoints
app.get('/move', (req, res) => {
    try {
        const boardParam = req.query.board;
        
        if (!boardParam) {
            return res.status(400).json({ 
                error: 'Parámetro board requerido',
                ejemplo: '/move?board=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
            });
        }

        const board = JSON.parse(boardParam);

        if (!Array.isArray(board) || board.length !== BOARD_LENGTH) {
            return res.status(400).json({ 
                error: 'El tablero debe ser un array de 25 posiciones'
            });
        }

        const move = TomarMovimiento(board);
        
        if (move === -1) {
            return res.status(400).json({ error: 'No hay movimientos disponibles' });
        }

        return res.json({ movimiento: move });

    } catch (error) {
        if (error instanceof SyntaxError) {
            return res.status(400).json({ error: 'JSON inválido' });
        }
        return res.status(500).json({ error: 'Error interno' });
    }
});

app.get('/health', (req, res) => {
    return res.json({ 
        status: 'OK', 
        message: 'Bot funcionando',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;