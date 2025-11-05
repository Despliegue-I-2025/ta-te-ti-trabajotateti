const express = require('express');
const app = express();

// =================================================================
// 1. CONSTANTES Y CONFIGURACIÓN
// =================================================================

const BOARD_LENGTH = 25; // 5x5
const WIN_COUNT = 4;     // 4 en línea
const EMPTY = 0;         // Celda vacía
const BOT_nuestro = 1;   // Identificador de nuestro bot
const Bot_oponente = 2;  // Identificador del oponente

// =================================================================
// 2. FUNCIONES AUXILIARES (AGREGAR LAS QUE FALTAN)
// =================================================================

/**
 * Convierte un índice 1D (0-24) a coordenadas 2D (fila, col).
 */
function toCoords(index) {
    const BOARD_SIZE = 5;
    return {
        row: Math.floor(index / BOARD_SIZE),
        col: index % BOARD_SIZE
    };
}

/**
 * Convierte coordenadas 2D (fila, col) a un índice 1D.
 */
function toIndex(row, col) {
    const BOARD_SIZE = 5;
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
        return -1;
    }
    return row * BOARD_SIZE + col;
}

/**
 * Función simplificada de búsqueda de amenazas
 */
function findOpenThreat(board, player, count) {
    // Implementación básica - busca primera posición vacía
    for (let i = 0; i < BOARD_LENGTH; i++) {
        if (board[i] === EMPTY) {
            return i;
        }
    }
    return null;
}

function findDoubleThreat(board) {
    return null; // Placeholder
}

// =================================================================
// 3. LÓGICA PRINCIPAL DEL BOT
// =================================================================

function TomarMovimiento(board) {
    console.log('Tablero recibido:', board);
    
    // Lógica mínima: encuentra la primera posición vacía
    for (let i = 0; i < BOARD_LENGTH; i++) {
        if (board[i] === EMPTY) {
            console.log('Movimiento elegido:', i);
            return i;
        }
    }
    
    return -1; // No hay movimientos
}

// =================================================================
// 4. MIDDLEWARE Y ENDPOINTS
// =================================================================

// Middleware para logging (útil para debug en Vercel)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.get('/move', (req, res) => {
    try {
        console.log('Query recibido:', req.query);
        
        const boardParam = req.query.board;
        
        if (!boardParam) {
            return res.status(400).json({ 
                error: 'Parámetro board requerido',
                ejemplo: '/move?board=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
            });
        }

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
        console.error('Error en /move:', error);
        
        if (error instanceof SyntaxError) {
            return res.status(400).json({ 
                error: 'JSON inválido en parámetro board',
                sugerencia: 'Asegúrate de usar el formato correcto: [0,0,0,...] con 25 números'
            });
        }
        
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            detalle: error.message
        });
    }
});

app.get('/move', (req, res) => {
    return res.json({ 
        status: 'OK', 
        message: 'Bot de 4 en línea (5x5) funcionando en Vercel',
        timestamp: new Date().toISOString(),
        board_length: BOARD_LENGTH,
        win_condition: WIN_COUNT
    });
});

app.get('/', (req, res) => {
    return res.redirect('/move');
});

app.use('*', (req, res) => {
    return res.status(404).json({ 
        error: 'Endpoint no encontrado',
        endpoints_disponibles: [
            '/move',
            '/move?board=[array]'
        ],
        ejemplo: '/move?board=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'
    });
});

// =================================================================
// 5. EXPORTACIÓN PARA VERCEL
// =================================================================

// ✅ EXPORTACIÓN CORRECTA PARA VERCEL
module.exports = app;

// Nota: No iniciamos el servidor con app.listen() 
// porque Vercel maneja esto automáticamente