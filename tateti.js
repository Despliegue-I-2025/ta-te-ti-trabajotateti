const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Constantes para los jugadores
const BOT_MARKER = 1;
const OPPONENT_MARKER = 2;
const EMPTY = 0;

// Combinaciones ganadoras
const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Filas
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columnas
    [0, 4, 8], [2, 4, 6]             // Diagonales
];

// Middleware para logging (útil para debugging)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

/**
 * Encuentra movimientos ganadores o bloqueadores
 */
function findWinningOrBlockingMove(board, player) {
    for (const combination of WINNING_COMBINATIONS) {
        const positions = combination.map(pos => board[pos]);
        const emptySpot = combination.find(pos => board[pos] === EMPTY);
        const playerCount = positions.filter(marker => marker === player).length;
        
        if (playerCount === 2 && emptySpot !== undefined && board[emptySpot] === EMPTY) {
            return emptySpot;
        }
    }
    return null;
}

/**
 * Función principal para el movimiento del bot
 */
function getBotMove(board) {
    console.log('Tablero recibido:', board);
    
    // 1. Ganar si es posible
    const winningMove = findWinningOrBlockingMove(board, BOT_MARKER);
    if (winningMove !== null) {
        console.log('Movimiento ganador encontrado:', winningMove);
        return winningMove;
    }

    // 2. Bloquear al oponente
    const blockingMove = findWinningOrBlockingMove(board, OPPONENT_MARKER);
    if (blockingMove !== null) {
        console.log('Movimiento bloqueador encontrado:', blockingMove);
        return blockingMove;
    }

    // 3. Priorizar el centro
    if (board[4] === EMPTY) {
        console.log('Movimiento al centro');
        return 4;
    }

    // 4. Priorizar esquinas
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => board[corner] === EMPTY);
    if (availableCorners.length > 0) {
        const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        console.log('Movimiento a esquina:', randomCorner);
        return randomCorner;
    }

    // 5. Cualquier movimiento disponible
    const emptyPositions = board
        .map((value, index) => value === EMPTY ? index : null)
        .filter(index => index !== null);
    
    if (emptyPositions.length > 0) {
        const randomMove = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        console.log('Movimiento aleatorio:', randomMove);
        return randomMove;
    }
    
    // Si no hay movimientos disponibles
    return -1;
}

// Endpoint principal
app.get('/move', (req, res) => {
    try {
        const boardParam = req.query.board;
        
        if (!boardParam) {
            return res.status(400).json({ error: 'Parámetro board requerido' });
        }

        const board = JSON.parse(boardParam);
        
        if (!Array.isArray(board) || board.length !== 9) {
            return res.status(400).json({ 
                error: 'El tablero debe ser un array de 9 posiciones (0-8)' 
            });
        }

        // Validar que el tablero solo contenga 0, 1 o 2
        const validValues = board.every(cell => [0, 1, 2].includes(cell));
        if (!validValues) {
            return res.status(400).json({ 
                error: 'El tablero solo puede contener valores 0, 1 o 2' 
            });
        }

        const move = getBotMove(board);
        
        if (move === -1) {
            return res.status(400).json({ error: 'No hay movimientos disponibles' });
        }

        res.json({ 
            movimiento: move,
            tablero: board,
            mensaje: `Movimiento en posición ${move}`
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            detalle: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Bot de Ta-Te-Ti funcionando',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint no encontrado',
        endpoints_disponibles: ['/move?board=[array]', '/health']
    });
});

app.listen(PORT, () => {
    console.log(`🤖 Bot de Ta-Te-Ti escuchando en puerto ${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/move?board=[0,0,0,0,0,0,0,0,0]`);
});