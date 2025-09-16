const express = require('express');
const app = express();
const PORT = 3000;


const BOT_Nuestro = 1;
const Bot_oponente = 2;
const albitro = 0;


const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]             


app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

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

function getBotMove(board) {
    console.log('Tablero recibido:', board);
    
    // Ganar si es posible
    const winningMove = findWinningOrBlockingMove(board, BOT_MARKER);
    if (winningMove !== null) {
        console.log('Movimiento ganador encontrado:', winningMove);
        return winningMove;
    }

    // Bloquear al oponente
    const blockingMove = findWinningOrBlockingMove(board, OPPONENT_MARKER);
    if (blockingMove !== null) {
        console.log('Movimiento bloqueador encontrado:', blockingMove);
        return blockingMove;
    }

    // Priorizar el centro
    if (board[4] === EMPTY) {
        console.log('Movimiento al centro');
        return 4;
    }

    // Priorizar esquinas
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => board[corner] === EMPTY);
    if (availableCorners.length > 0) {
        const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        console.log('Movimiento a esquina:', randomCorner);
        return randomCorner;
    }

    // Cualquier movimiento disponible
    const emptyPositions = board
        .map((value, index) => value === EMPTY ? index : null)
        .filter(index => index !== null);
    
    if (emptyPositions.length > 0) {
        const randomMove = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
        console.log('Movimiento aleatorio:', randomMove);
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


app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Bot de Ta-Te-Ti funcionando',
        timestamp: new Date().toISOString()
    });
});

// error404
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