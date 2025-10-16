const express = require('express');
const app = express();
app.use(express.json());
const PORT = 3020;

// --- CONFIGURACIÓN DEL JUEGO 5x5 (4 en línea) ---
const BOARD_SIZE = 5;
const WIN_COUNT = 4;
const BOARD_LENGTH = BOARD_SIZE * BOARD_SIZE; // 25
const CENTER_POSITION = Math.floor(BOARD_LENGTH / 2); // 12

const BOT_nuestro = 1;
const Bot_oponente = 2;
const EMPTY = 0;

// Posiciones estratégicas por valor
const POSITION_VALUES = [
    3, 2, 3, 2, 3,
    2, 4, 3, 4, 2,
    3, 3, 5, 3, 3,
    2, 4, 3, 4, 2,
    3, 2, 3, 2, 3
];

// Posiciones estratégicas para cuando el centro está ocupado
const STRATEGIC_POSITIONS = [6, 8, 16, 18, 7, 11, 13, 17, 10, 14, 2, 22];

/**
 * Convierte un índice 1D (0-24) a coordenadas 2D (fila, col).
 */
function toCoords(index) {
    return {
        row: Math.floor(index / BOARD_SIZE),
        col: index % BOARD_SIZE
    };
}

/**
 * Convierte coordenadas 2D (fila, col) a un índice 1D.
 */
function toIndex(row, col) {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return -1;
    }
    return row * BOARD_SIZE + col;
}

/**
 * Obtiene todas las líneas posibles (horizontal, vertical, diagonal)
 */
function getAllLines() {
    const lines = [];
    
    // Horizontales
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c <= BOARD_SIZE - WIN_COUNT; c++) {
            const line = [];
            for (let i = 0; i < WIN_COUNT; i++) {
                line.push(toIndex(r, c + i));
            }
            lines.push(line);
        }
    }
    
    // Verticales
    for (let c = 0; c < BOARD_SIZE; c++) {
        for (let r = 0; r <= BOARD_SIZE - WIN_COUNT; r++) {
            const line = [];
            for (let i = 0; i < WIN_COUNT; i++) {
                line.push(toIndex(r + i, c));
            }
            lines.push(line);
        }
    }
    
    // Diagonales ↘
    for (let r = 0; r <= BOARD_SIZE - WIN_COUNT; r++) {
        for (let c = 0; c <= BOARD_SIZE - WIN_COUNT; c++) {
            const line = [];
            for (let i = 0; i < WIN_COUNT; i++) {
                line.push(toIndex(r + i, c + i));
            }
            lines.push(line);
        }
    }
    
    // Diagonales ↙
    for (let r = 0; r <= BOARD_SIZE - WIN_COUNT; r++) {
        for (let c = WIN_COUNT - 1; c < BOARD_SIZE; c++) {
            const line = [];
            for (let i = 0; i < WIN_COUNT; i++) {
                line.push(toIndex(r + i, c - i));
            }
            lines.push(line);
        }
    }
    
    return lines;
}

const ALL_LINES = getAllLines();

/**
 * Evalúa una línea para un jugador específico
 */
function evaluateLine(board, line, player) {
    let playerCount = 0;
    let emptyCount = 0;
    let opponentCount = 0;
    
    for (const pos of line) {
        if (board[pos] === player) {
            playerCount++;
        } else if (board[pos] === EMPTY) {
            emptyCount++;
        } else {
            opponentCount++;
        }
    }
    
    // Si hay fichas del oponente, esta línea no es útil para el jugador
    if (opponentCount > 0) {
        return { score: 0, playerCount, emptyCount, opponentCount };
    }
    
    // Puntuación basada en cuántas fichas tenemos en la línea
    let score = 0;
    if (playerCount === WIN_COUNT - 1 && emptyCount === 1) {
        score = 1000; // Victoria inminente
    } else if (playerCount === WIN_COUNT - 2 && emptyCount === 2) {
        score = 100; // Línea prometedora
    } else if (playerCount === WIN_COUNT - 3 && emptyCount === 3) {
        score = 10; // Línea inicial
    } else if (playerCount > 0) {
        score = playerCount * 5; // Valor base por fichas existentes
    }
    
    return { score, playerCount, emptyCount, opponentCount };
}

/**
 * Busca amenazas inmediatas (3 en línea con espacio para 4)
 */
function findImmediateThreats(board, player) {
    const threats = [];
    
    for (const line of ALL_LINES) {
        const evaluation = evaluateLine(board, line, player);
        if (evaluation.playerCount === WIN_COUNT - 1 && evaluation.emptyCount === 1) {
            // Encontrar la posición vacía en esta línea
            for (const pos of line) {
                if (board[pos] === EMPTY) {
                    threats.push(pos);
                    break;
                }
            }
        }
    }
    
    return [...new Set(threats)]; // Eliminar duplicados
}

/**
 * Evalúa la fuerza de un movimiento
 */
function evaluateMove(board, move, player) {
    const testBoard = [...board];
    testBoard[move] = player;
    
    let score = POSITION_VALUES[move]; // Valor base de la posición
    
    // Evaluar todas las líneas que incluyen este movimiento
    for (const line of ALL_LINES) {
        if (line.includes(move)) {
            const evaluation = evaluateLine(testBoard, line, player);
            score += evaluation.score;
            
            // Penalizar líneas bloqueadas por el oponente
            if (evaluation.opponentCount > 0) {
                score -= 2;
            }
        }
    }
    
    return score;
}

/**
 * Busca movimientos que creen múltiples amenazas
 */
function findForkMoves(board, player) {
    const emptyPositions = board
        .map((value, index) => value === EMPTY ? index : null)
        .filter(index => index !== null);
    
    const forkMoves = [];
    
    for (const pos of emptyPositions) {
        const testBoard = [...board];
        testBoard[pos] = player;
        
        // Contar cuántas líneas de 3 en línea crea este movimiento
        let threatCount = 0;
        for (const line of ALL_LINES) {
            if (line.includes(pos)) {
                const evaluation = evaluateLine(testBoard, line, player);
                if (evaluation.playerCount === WIN_COUNT - 1 && evaluation.emptyCount === 1) {
                    threatCount++;
                }
            }
        }
        
        if (threatCount >= 2) {
            forkMoves.push({ pos, threats: threatCount });
        }
    }
    
    return forkMoves.sort((a, b) => b.threats - a.threats);
}

/**
 * Busca movimientos que bloqueen forks del oponente
 */
function findForkBlocks(board, player) {
    const opponent = player === BOT_nuestro ? Bot_oponente : BOT_nuestro;
    const opponentForks = findForkMoves(board, opponent);
    
    if (opponentForks.length === 0) return null;
    
    // Si el oponente tiene un fork, buscar movimientos que bloqueen múltiples amenazas
    const emptyPositions = board
        .map((value, index) => value === EMPTY ? index : null)
        .filter(index => index !== null);
    
    let bestBlock = null;
    let maxBlocks = 0;
    
    for (const pos of emptyPositions) {
        const testBoard = [...board];
        testBoard[pos] = player;
        
        // Contar cuántas amenazas del oponente bloquea este movimiento
        let blocks = 0;
        for (const fork of opponentForks) {
            const forkTestBoard = [...testBoard];
            forkTestBoard[fork.pos] = opponent;
            
            let stillThreat = false;
            for (const line of ALL_LINES) {
                if (line.includes(fork.pos)) {
                    const evaluation = evaluateLine(forkTestBoard, line, opponent);
                    if (evaluation.playerCount === WIN_COUNT - 1 && evaluation.emptyCount === 1) {
                        stillThreat = true;
                        break;
                    }
                }
            }
            
            if (!stillThreat) {
                blocks++;
            }
        }
        
        if (blocks > maxBlocks) {
            maxBlocks = blocks;
            bestBlock = pos;
        }
    }
    
    return bestBlock;
}

/**
 * FUNCIÓN MANTENIDA PARA LOS TESTS - Busca amenazas abiertas
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
                        // Devolver la primera posición vacía
                        return emptySpots[0];
                    }
                }
            }
        }
    }
    return null;
}

/**
 * FUNCIÓN MANTENIDA PARA LOS TESTS - Busca dobles amenazas (versión simple)
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
 * Estrategia mejorada para tomar movimientos
 */
function TomarMovimiento(board) {
    if (process.env.NODE_ENV !== 'test') {
        console.log('Tablero 5x5 recibido:', board);
    }
    
    // 1. GANAR: Movimiento ganador inmediato
    const winningMoves = findImmediateThreats(board, BOT_nuestro);
    if (winningMoves.length > 0) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento ganador encontrado:', winningMoves[0]);
        }
        return winningMoves[0];
    }
    
    // 2. BLOQUEAR: Bloquear victoria inmediata del oponente
    const blockingMoves = findImmediateThreats(board, Bot_oponente);
    if (blockingMoves.length > 0) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento bloqueador encontrado:', blockingMoves[0]);
        }
        return blockingMoves[0];
    }
    
    // 3. CREAR FORK: Movimientos que creen múltiples amenazas
    const forkMoves = findForkMoves(board, BOT_nuestro);
    if (forkMoves.length > 0) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento fork encontrado:', forkMoves[0].pos);
        }
        return forkMoves[0].pos;
    }
    
    // 4. BLOQUEAR FORK: Bloquear forks del oponente
    const forkBlock = findForkBlocks(board, BOT_nuestro);
    if (forkBlock !== null) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Bloqueando fork del oponente:', forkBlock);
        }
        return forkBlock;
    }
    
    // 5. CENTRO (mantenido para compatibilidad con tests)
    if (board[CENTER_POSITION] === EMPTY) {
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento al centro (12)');
        }
        return CENTER_POSITION;
    }
    
    // 6. POSICIONES ESTRATÉGICAS (mantenido para compatibilidad con tests)
    const availableStrategic = STRATEGIC_POSITIONS.filter(pos => board[pos] === EMPTY);
    if (availableStrategic.length > 0) {
        // En lugar de aleatorio, elegir la mejor posición estratégica
        const scoredStrategic = availableStrategic.map(pos => ({
            pos,
            score: evaluateMove(board, pos, BOT_nuestro)
        })).sort((a, b) => b.score - a.score);
        
        const bestStrategic = scoredStrategic[0].pos;
        if (process.env.NODE_ENV !== 'test') {
            console.log('Movimiento estratégico:', bestStrategic);
        }
        return bestStrategic;
    }
    
    // 7. MOVIMIENTOS ESTRATÉGICOS: Evaluar todos los movimientos posibles
    const emptyPositions = board
        .map((value, index) => value === EMPTY ? index : null)
        .filter(index => index !== null);
    
    if (emptyPositions.length === 0) {
        return -1;
    }
    
    // Evaluar cada movimiento posible
    const scoredMoves = emptyPositions.map(pos => ({
        pos,
        score: evaluateMove(board, pos, BOT_nuestro)
    }));
    
    // Ordenar por puntuación descendente
    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Tomar el mejor movimiento
    const bestMove = scoredMoves[0].pos;
    
    if (process.env.NODE_ENV !== 'test') {
        console.log('Mejor movimiento estratégico:', bestMove, 'con puntuación:', scoredMoves[0].score);
    }
    
    return bestMove;
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

        return res.json({ 
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
            console.error('Error interno del servidor:', error);
        }
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            detalle: error.message 
        });
    }
});

app.get('/health', (req, res) => {
    return res.json({ 
        status: 'OK', 
        message: 'Bot de 4 en línea (5x5) funcionando',
        timestamp: new Date().toISOString()
    });
});

app.use('*', (req, res) => {
    return res.status(404).json({ 
        error: 'Endpoint no encontrado',
        endpoints_disponibles: ['/move?board=[array]', '/health']
    });
});
/*
let server;
if (process.env.NODE_ENV !== 'test' || require.main === module) {
    server = app.listen(PORT, () => {
        const emptyBoard = Array(BOARD_LENGTH).fill(0).toString();
        console.log(`Bot escuchando en puerto ${PORT}`);
        console.log(`Endpoint: http://localhost:${PORT}/move?board=[${emptyBoard}]`);
        console.log(`Health check: http://localhost:${PORT}/health`);
    });
}*/

exports = {
    app,
    findOpenThreat,
    findDoubleThreat,
    TomarMovimiento,
    BOT_nuestro,
    Bot_oponente,
    EMPTY,
    BOARD_LENGTH,
    WIN_COUNT
};