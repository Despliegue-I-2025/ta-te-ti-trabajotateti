const express = require('express');
const app = express();
const PORT = process.env.PORT || 3007;

const BOT_nuestro = 1;
const Bot_oponente = 2;
const EMPTY = 0;

const combinaciones_ganadoras = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]            
];

function ganaroBloquear(board, player) {
    for (const combination of combinaciones_ganadoras) {
        const positions = combination.map(pos => board[pos]);
        const emptySpot = combination.find(pos => board[pos] === EMPTY);
        const playerCount = positions.filter(marker => marker === player).length;
        
        if (playerCount === 2 && emptySpot !== undefined && board[emptySpot] === EMPTY) {
            return emptySpot;
        }
    }
    return null;
}

function TomarMovimiento(board) {
    // Solo mostrar logs si no estamos en entorno de test
    if (process.env.NODE_ENV !== 'test') {
        console.log('Tablero recibido:', board);
    }
    
    const winningMove = ganaroBloquear(board, BOT_nuestro);
    if (winningMove !== null) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento ganador encontrado:', winningMove);
        }
        return winningMove;
    }

    const blockingMove = ganaroBloquear(board, Bot_oponente);
    if (blockingMove !== null) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento bloqueador encontrado:', blockingMove);
        }
        return blockingMove;
    }

    if (board[4] === EMPTY) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento al centro');
        }
        return 4;
    }

    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => board[corner] === EMPTY);
    if (availableCorners.length > 0) {
        const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento a esquina:', randomCorner);
        }
        return randomCorner;
    }

    const emptyPositions = board
        .map((value, index) => value === EMPTY ? index : null)
        .filter(index => index !== null);
    
    if (emptyPositions.length > 0) {
        const randomMove = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento aleatorio:', randomMove);
        }
        return randomMove;
    }
    
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

        const move = TomarMovimiento(board);
        
        if (move === -1) {
            return res.status(400).json({ error: 'No hay movimientos disponibles' });
        }

        res.json({ 
            movimiento: move,
            tablero: board,
            mensaje: `Movimiento en posición ${move}`
        });

    } catch (error) {
        // Si es error de JSON, retornar 400 en lugar de 500
        if (error instanceof SyntaxError) {
            return res.status(400).json({ 
                error: 'JSON inválido en parámetro board' 
            });
        }
        
        if (process.env.NODE_ENV !== 'test') {
            console.error('Error:', error);
        }
        res.status(500).json({ 
            error: 'Error interno del servidor',
            detalle: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Bot de Ta-Te-Ti funcionando',
        timestamp: new Date().toISOString()
    });
});

// Manejo de error 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint no encontrado',
        endpoints_disponibles: ['/move?board=[array]', '/health']
    });
});

// Solo iniciar el servidor si no estamos en entorno de test
let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        console.log(`🤖 Bot de Ta-Te-Ti escuchando en puerto ${PORT}`);
        console.log(`📍 Endpoint: http://localhost:${PORT}/move?board=[0,0,0,0,0,0,0,0,0]`);
    });
}

// Exportar para testing
module.exports = {
    app,
    server: process.env.NODE_ENV !== 'test' ? server : null,
    ganaroBloquear,
    TomarMovimiento,
    combinaciones_ganadoras,
    BOT_nuestro,
    Bot_oponente,
    EMPTY
};