const express = require('express');
const app = express();
const PORT = process.env.PORT || 3007;

// --- CONFIGURACIÓN DEL JUEGO 5x5 (4 en línea) ---
const BOARD_SIZE = 5;
const WIN_COUNT = 4;
const BOARD_LENGTH = BOARD_SIZE * BOARD_SIZE; // 25
const CENTER_POSITION = Math.floor(BOARD_LENGTH / 2); // 12

const BOT_nuestro = 1;
const Bot_oponente = 2;
const EMPTY = 0;

/**
 * Convierte un índice 1D (0-24) a coordenadas 2D (fila, col).
 * @param {number} index - El índice 1D (0-24).
 * @returns {{row: number, col: number}} Las coordenadas 2D.
 */
function toCoords(index) {
    return {
        row: Math.floor(index / BOARD_SIZE),
        col: index % BOARD_SIZE
    };
}

/**
 * Convierte coordenadas 2D (fila, col) a un índice 1D.
 * @param {number} row 
 * @param {number} col 
 * @returns {number} El índice 1D.
 */
function toIndex(row, col) {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return -1; // Fuera de límites
    }
    return row * BOARD_SIZE + col;
}

/**
 * Busca si hay una amenaza de 'count' fichas seguidas con espacios para completar WIN_COUNT
 * @param {Array<number>} board - El tablero.
 * @param {number} player - El marcador del jugador (1 o 2).
 * @param {number} count - El número de fichas seguidas que buscamos.
 * @returns {number | null} La posición vacía para completar la línea, o null.
 */
function findOpenThreat(board, player, count) {
    const directions = [
        [0, 1],   // Horizontal derecha
        [1, 0],   // Vertical abajo
        [1, 1],   // Diagonal abajo-derecha
        [1, -1]   // Diagonal abajo-izquierda
    ];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            for (const [dr, dc] of directions) {
                // Revisar línea empezando en (r, c)
                let playerCount = 0;
                let emptySpots = [];
                
                // Revisar WIN_COUNT posiciones en esta dirección
                for (let i = 0; i < WIN_COUNT; i++) {
                    const curRow = r + i * dr;
                    const curCol = c + i * dc;
                    const curPos = toIndex(curRow, curCol);
                    
                    if (curPos === -1) {
                        // Fuera del tablero, línea no válida
                        playerCount = -1;
                        break;
                    }
                    
                    const cellValue = board[curPos];
                    
                    if (cellValue === player) {
                        playerCount++;
                    } else if (cellValue === EMPTY) {
                        emptySpots.push(curPos);
                    } else {
                        // Celda ocupada por oponente
                        playerCount = -1;
                        break;
                    }
                }
                
                // Si encontramos exactamente 'count' fichas del jugador y el resto vacías
                if (playerCount === count && emptySpots.length === (WIN_COUNT - count)) {
                    if (emptySpots.length > 0) {
                        if (process.env.NODE_ENV !== 'test') {
                            console.log(`Amenaza encontrada para jugador ${player}: ${count} fichas + ${emptySpots.length} vacías`);
                        }
                        // Devolver la primera posición vacía (podrías mejorar esto para elegir la mejor)
                        return emptySpots[0];
                    }
                }
            }
        }
    }
    return null;
}

/**
 * Busca patrones de doble amenaza (crear múltiples líneas ganadoras)
 */
function findDoubleThreat(board, player) {
    // Para cada posición vacía, simular movimiento y contar amenazas creadas
    const emptyPositions = board
        .map((value, index) => value === EMPTY ? index : null)
        .filter(index => index !== null);
    
    let bestMove = null;
    let maxThreats = 0;
    
    for (const pos of emptyPositions) {
        // Simular movimiento
        const testBoard = [...board];
        testBoard[pos] = player;
        
        // Contar cuántas amenazas de 3 en línea crea este movimiento
        let threatCount = 0;
        
        // Buscar líneas donde tengamos 3 fichas después de este movimiento
        const directions = [[0,1], [1,0], [1,1], [1,-1]];
        
        for (const [dr, dc] of directions) {
            const coords = toCoords(pos);
            
            // Revisar en ambas direcciones desde la posición actual
            for (let dir = -1; dir <= 1; dir += 2) {
                let playerCount = 1; // Empezamos con la ficha que acabamos de colocar
                let hasEmpty = false;
                
                for (let i = 1; i < WIN_COUNT; i++) {
                    const curRow = coords.row + i * dr * dir;
                    const curCol = coords.col + i * dc * dir;
                    const curPos = toIndex(curRow, curCol);
                    
                    if (curPos === -1) break;
                    
                    if (testBoard[curPos] === player) {
                        playerCount++;
                    } else if (testBoard[curPos] === EMPTY) {
                        hasEmpty = true;
                        break;
                    } else {
                        break;
                    }
                }
                
                if (playerCount >= 3 && hasEmpty) {
                    threatCount++;
                }
            }
        }
        
        if (threatCount > maxThreats) {
            maxThreats = threatCount;
            bestMove = pos;
        }
    }
    
    return bestMove;
}

/**
 * Implementa la estrategia para el bot 5x5.
 */
function TomarMovimiento(board) {
    if (process.env.NODE_ENV !== 'test') {
        console.log('Tablero 5x5 recibido:', board);
    }
    
    // 1. GANAR: Buscar 3 fichas nuestras + 1 vacía para hacer 4 en línea
    const winningMove = findOpenThreat(board, BOT_nuestro, 3);
    if (winningMove !== null) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento ganador encontrado (3+1):', winningMove);
        }
        return winningMove;
    }

    // 2. BLOQUEAR: Buscar 3 fichas del oponente + 1 vacía
    const blockingMove = findOpenThreat(board, Bot_oponente, 3);
    if (blockingMove !== null) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento bloqueador encontrado (3+1):', blockingMove);
        }
        return blockingMove;
    }

    // 3. CREAR DOBLE AMENAZA: Buscar movimientos que creen múltiples amenazas
    const doubleThreatMove = findDoubleThreat(board, BOT_nuestro);
    if (doubleThreatMove !== null) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento de doble amenaza:', doubleThreatMove);
        }
        return doubleThreatMove;
    }

    // 4. BLOQUEAR AMENAZAS DE 2: Buscar y bloquear líneas prometedoras del oponente
    const blockTwoMove = findOpenThreat(board, Bot_oponente, 2);
    if (blockTwoMove !== null) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Bloqueando línea de 2:', blockTwoMove);
        }
        return blockTwoMove;
    }

    // 5. CENTRO
    if (board[CENTER_POSITION] === EMPTY) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento al centro (12)');
        }
        return CENTER_POSITION;
    }
    
    // 6. POSICIONES ESTRATÉGICAS
    const strategicPositions = [
        6, 8, 16, 18,    // Esquinas del 3x3 interior
        7, 11, 13, 17,   // Centros de bordes interiores
        10, 14, 2, 22    // Posiciones estratégicas adicionales
    ];

    const availableStrategic = strategicPositions.filter(pos => board[pos] === EMPTY);
    if (availableStrategic.length > 0) {
        const randomStrategic = availableStrategic[Math.floor(Math.random() * availableStrategic.length)];
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento estratégico:', randomStrategic);
        }
        return randomStrategic;
    }
    
    // 7. CUALQUIER MOVIMIENTO DISPONIBLE
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
    
    return -1; // No hay movimientos disponibles
}

// ----------------------------------------------------------------------
// --- ENDPOINTS Y SERVIDOR ---
// ----------------------------------------------------------------------

app.get('/move', (req, res) => {
    try {
        const boardParam = req.query.board;
        
        if (!boardParam) {
            return res.status(400).json({ error: 'Parámetro board requerido' });
        }

        const board = JSON.parse(boardParam);
        
        if (!Array.isArray(board) || board.length !== BOARD_LENGTH) {
            return res.status(400).json({ 
                error: `El tablero debe ser un array de ${BOARD_LENGTH} posiciones (0-${BOARD_LENGTH - 1}) para 5x5` 
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

        res.json({ 
            movimiento: move,
            tablero: board,
            mensaje: `Movimiento en posición ${move}`
        });

    } catch (error) {
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
        message: 'Bot de 4 en línea (5x5) funcionando',
        timestamp: new Date().toISOString()
    });
});

app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint no encontrado',
        endpoints_disponibles: ['/move?board=[array]', '/health']
    });
});

let server;
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        const emptyBoard = Array(BOARD_LENGTH).fill(0).toString();
        console.log(`Bot  escuchando en puerto ${PORT}`);
        console.log(`Endpoint: http://localhost:${PORT}/move?board=[${emptyBoard}]`);
    });
}

module.exports = {
    app,
    server: process.env.NODE_ENV !== 'test' ? server : null,
    findOpenThreat,
    findDoubleThreat,
    TomarMovimiento,
    BOT_nuestro,
    Bot_oponente,
    EMPTY,
    BOARD_LENGTH,
    WIN_COUNT
};