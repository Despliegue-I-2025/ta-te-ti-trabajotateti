const express = require('express');
const app = express();
const PORT = 3020; // Solo para uso local

// =================================================================
// 1. CONSTANTES Y CONFIGURACIÓN
// =================================================================

const BOARD_SIZE = 5;
const WIN_COUNT = 4;
const BOARD_LENGTH = BOARD_SIZE * BOARD_SIZE; // 25
const CENTER_POSITION = Math.floor(BOARD_LENGTH / 2); // 12

const EMPTY = 0;         // Celda vacía
const BOT_nuestro = 1;   // Identificador de nuestro bot
const Bot_oponente = 2;  // Identificador del oponente

// Direcciones a verificar: [dr, dc] (Cambio en Fila, Cambio en Columna)
const DIRECTIONS = [
    [0, 1],  // Horizontal (derecha)
    [1, 0],  // Vertical (abajo)
    [1, 1],  // Diagonal principal (↘)
    [1, -1]  // Anti-Diagonal (↙)
];

// =================================================================
// 2. LÓGICA DE JUEGO
// =================================================================

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
        return -1; // Indica fuera de límites
    }
    return row * BOARD_SIZE + col;
}

/**
 * Cuenta las piezas consecutivas de un jugador en una dirección específica
 * a partir de una posición inicial (startRow, startCol) y avanza en la dirección (dr, dc).
 */
function countConsecutive(board, player, startRow, startCol, dr, dc) {
    let count = 0;
    let r = startRow;
    let c = startCol;

    // Solo necesitamos revisar hasta WIN_COUNT posiciones.
    for (let i = 0; i < WIN_COUNT; i++) {
        let index = toIndex(r, c);
        // Si se sale del tablero o la celda no pertenece al jugador, detenemos la cuenta.
        if (index === -1 || board[index] !== player) {
            break;
        }
        count++;
        r += dr;
        c += dc;
    }
    return count;
}


/**
 * Verifica si colocar una pieza en 'moveIndex' resulta en una victoria para 'player'.
 * (Requiere que el movimiento ya esté simulado en el tablero).
 */
function isWinningMove(board, player, moveIndex) {
    const { row: r, col: c } = toCoords(moveIndex);

    for (const [dr, dc] of DIRECTIONS) {
        // Contar en ambas direcciones (hacia adelante y hacia atrás) desde la casilla jugada.
        const countForward = countConsecutive(board, player, r + dr, c + dc, dr, dc);
        const countBackward = countConsecutive(board, player, r - dr, c - dc, -dr, -dc);

        // El total incluye la pieza jugada (1) más las contadas en ambas direcciones.
        const total = 1 + countForward + countBackward;

        if (total >= WIN_COUNT) {
            return true;
        }
    }
    return false;
}

/**
 * Busca un movimiento que gane inmediatamente el juego para 'player' o bloquee a 'player'.
 * Simula todas las jugadas posibles en casillas vacías y usa isWinningMove para verificar.
 */
function findWinningOrBlockingMove(board, player) {
    for (let i = 0; i < BOARD_LENGTH; i++) {
        if (board[i] === EMPTY) {
            // 1. Simular el movimiento
            board[i] = player;

            // 2. Verificar si este movimiento gana
            if (isWinningMove(board, player, i)) {
                // 3. Deshacer el movimiento simulado (CRÍTICO)
                board[i] = EMPTY; 
                return i; // ¡Movimiento encontrado!
            }

            // 4. Deshacer el movimiento simulado
            board[i] = EMPTY;
        }
    }
    return -1; // No se encontró ningún movimiento ganador/bloqueador
}

/**
 * Función de búsqueda de amenazas (implementación para el test).
 */
function findOpenThreat(board, player, count) {
    // Usamos la función de chequeo de victoria si se busca 4 en línea
    if (count === WIN_COUNT) {
        return findWinningOrBlockingMove(board, player);
    }
    // Para amenazas menores (3 en línea, etc.), devolvemos null, ya que es una lógica compleja
    return null;
}

/**
 * Lógica principal para decidir el movimiento.
 */
function TomarMovimiento(board) {
    
    // 1. **Prioridad Ganadora:** Verifica si nuestro bot puede ganar ahora.
    const winningMove = findWinningOrBlockingMove(board, BOT_nuestro);
    if (winningMove !== -1) {
        // console.log('Movimiento elegido (Ganar):', winningMove);
        return winningMove;
    }

    // 2. **Prioridad Bloqueo:** Bloquea la jugada ganadora del oponente.
    const blockingMove = findWinningOrBlockingMove(board, Bot_oponente);
    if (blockingMove !== -1) {
        // console.log('Movimiento elegido (Bloquear):', blockingMove);
        return blockingMove;
    }
    
    // 3. **Prioridad Centro:** Jugar en el centro (posición 12).
    if (board[CENTER_POSITION] === EMPTY) {
        return CENTER_POSITION;
    }

    // 4. **Prioridad Esquinas:** Jugar en las esquinas.
    const corners = [0, BOARD_SIZE - 1, BOARD_LENGTH - BOARD_SIZE, BOARD_LENGTH - 1];
    for (const corner of corners) {
        if (board[corner] === EMPTY) {
            return corner;
        }
    }
    
    // 5. **Prioridad Simple (Fallback):** Primera casilla vacía.
    for (let i = 0; i < BOARD_LENGTH; i++) {
        if (board[i] === EMPTY) {
            return i;
        }
    }
    
    return -1; // No hay movimientos
}


// =================================================================
// 3. MIDDLEWARE Y ENDPOINTS (Estructura robusta de API)
// =================================================================

// Middleware para logging (fundamental para debug en Vercel)
app.use((req, res, next) => {
    // console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Endpoint principal para solicitar el movimiento del bot
app.get('/move', (req, res) => {
    try {
        const boardParam = req.query.board;
        
        if (!boardParam) {
            return res.status(400).json({ 
                error: 'Parámetro board requerido',
                ejemplo: '/move?board=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
            });
        }

        // Parsea el array (maneja errores JSON)
        const board = JSON.parse(boardParam); 
        
        // Validación de longitud
        if (!Array.isArray(board) || board.length !== BOARD_LENGTH) {
            return res.status(400).json({ 
                error: `El tablero debe tener exactamente ${BOARD_LENGTH} posiciones`,
                longitud_recibida: board.length
            });
        }

        // Validación de valores
        const validValues = board.every(cell => [EMPTY, BOT_nuestro, Bot_oponente].includes(cell));
        if (!validValues) {
            return res.status(400).json({ 
                error: 'Valores inválidos en el tablero',
                valores_permitidos: [EMPTY, BOT_nuestro, Bot_oponente]
            });
        }

        const move = TomarMovimiento(board);
        
        if (move === -1) {
            return res.status(400).json({ 
                error: 'No hay movimientos disponibles',
                tablero: board
            });
        }

        // Respuesta exitosa
        return res.json({ 
            movimiento: move,
            mensaje: `Movimiento en posición ${move}`
        });

    } catch (error) {
        console.error('Error en /move:', error.stack);
        
        if (error instanceof SyntaxError) {
            return res.status(400).json({ 
                error: 'JSON inválido en parámetro board',
                sugerencia: 'Asegúrate de usar el formato correcto: [0,0,0,...] con 25 números'
            });
        }
        
        // Error 500 capturado por el try/catch
        return res.status(500).json({ 
            error: 'Error interno del servidor (ver logs)',
            detalle: error.message
        });
    }
});

// Endpoint de salud (útil para verificar que la función está viva)
app.get('/health', (req, res) => {
    return res.json({ 
        status: 'OK', 
        message: 'Bot de 4 en línea (5x5) funcionando en Vercel',
        timestamp: new Date().toISOString(),
        board_length: BOARD_LENGTH,
        win_condition: WIN_COUNT
    });
});

// Manejo de rutas no encontradas (404).
app.use('*', (req, res) => {
    return res.status(404).json({ 
        error: 'Endpoint no encontrado',
        endpoints_disponibles: [
            '/health',
            '/move?board=[array]'
        ],
        ejemplo: '/move?board=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
    });
});


// =================================================================
// 4. INICIO Y EXPORTACIÓN CANÓNICA PARA VERCEL
// =================================================================

// Solo inicia el servidor si NO estamos en Vercel ni en tests (para desarrollo local)
if (process.env.VERCEL_ENV === undefined && process.env.NODE_ENV !== 'test') { 
    app.listen(PORT, () => {
        const emptyBoard = Array(BOARD_LENGTH).fill(0).toString();
        console.log(`Bot  escuchando en puerto ${PORT}`);
        console.log(`Endpoint de prueba: http://localhost:${PORT}/move?board=[${emptyBoard}]`);
    });
}

// 🟢 EXPORTACIÓN PRINCIPAL PARA VERCEL: La instancia de Express 'app'.
module.exports = app;

// 🟢 EXPORTACIONES ADICIONALES PARA JEST/TESTS:
// Exportamos todas las funciones unitarias necesarias.
module.exports.TomarMovimiento = TomarMovimiento;
module.exports.toCoords = toCoords;
module.exports.toIndex = toIndex;
module.exports.findOpenThreat = findOpenThreat;
module.exports.BOT_nuestro = BOT_nuestro;
module.exports.Bot_oponente = Bot_oponente;
module.exports.BOARD_LENGTH = BOARD_LENGTH;
module.exports.WIN_COUNT = WIN_COUNT;
module.exports.CENTER_POSITION = CENTER_POSITION;
module.exports.isWinningMove = isWinningMove;
module.exports.findWinningOrBlockingMove = findWinningOrBlockingMove;