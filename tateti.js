const express = require('express');
const app = express();

// =================================================================
// 1. CONSTANTES Y CONFIGURACIÓN
// =================================================================

// Definición de PORT: usa la variable de entorno o el puerto 3000 por defecto.
// NOTA: Esta variable solo se usa si se ejecuta localmente.
const PORT = process.env.PORT || 3000; 

// Constantes del Juego (asumiendo 5x5 como se indica en los comentarios del código original)
const BOARD_LENGTH = 25; // 5x5
const WIN_COUNT = 4;     // 4 en línea
const EMPTY = 0;         // Celda vacía
const BOT_nuestro = 1;   // Identificador de nuestro bot
const Bot_oponente = 2;  // Identificador del oponente

// =================================================================
// 2. LÓGICA DEL BOT (Funciones mínimas para hacerlo ejecutable)
// =================================================================

/**
 * Función central de la IA. Aquí es donde se implementaría la lógica de juego
 * (MiniMax, búsqueda de amenazas, etc.).
 * @param {number[]} board - El estado actual del tablero (array plano de 25 posiciones).
 * @returns {number} El índice (0-24) de la mejor jugada, o -1 si no hay jugadas.
 */
function TomarMovimiento(board) {
    // Lógica mínima: simplemente encuentra la primera posición vacía.
    const emptyIndex = board.findIndex(cell => cell === EMPTY);
    // En una implementación real, aquí iría la lógica avanzada.
    return emptyIndex;
}

// Placeholders para funciones que se exportan pero no se usan directamente en Express
function findOpenThreat(board) { return -1; }
function findDoubleThreat(board) { return -1; }

// =================================================================
// 3. ENDPOINTS DE LA API
// =================================================================

/**
 * Endpoint principal para solicitar un movimiento al bot.
 * Recibe el estado del tablero y devuelve la posición de la jugada.
 * Ejemplo de uso: /move?board=[0,0,0,1,2,0,....]
 */
app.get('/move', (req, res) => {
    try {
        const boardParam = req.query.board;
        
        if (!boardParam) {
            return res.status(400).json({ error: 'Parámetro board requerido' });
        }

        const board = JSON.parse(boardParam);
        
        // 1. Validación de longitud del tablero
        if (!Array.isArray(board) || board.length !== BOARD_LENGTH) {
            return res.status(400).json({ 
                error: `El tablero debe ser un array de ${BOARD_LENGTH} posiciones (0-${BOARD_LENGTH - 1}) para 5x5` 
            });
        }

        // 2. Validación de valores de celda
        const validValues = board.every(cell => [EMPTY, BOT_nuestro, Bot_oponente].includes(cell));
        if (!validValues) {
            return res.status(400).json({ 
                error: `El tablero solo puede contener valores ${EMPTY}, ${BOT_nuestro} o ${Bot_oponente}` 
            });
        }

        // Obtener el movimiento
        const move = TomarMovimiento(board);
        
        if (move === -1) {
            // Este caso ocurre si el tablero está lleno y no hay jugadas disponibles
            return res.status(400).json({ error: 'No hay movimientos disponibles (tablero lleno)' });
        }

        // Respuesta exitosa
        res.json({ 
            movimiento: move,
            tablero: board,
            mensaje: `Movimiento en posición ${move}`
        });

    } catch (error) {
        if (error instanceof SyntaxError) {
            // Error al parsear el JSON de la URL
            return res.status(400).json({ 
                error: 'JSON inválido en parámetro board. Asegúrate de que el array esté bien formado.' 
            });
        }
        
        if (process.env.NODE_ENV !== 'test') {
            console.error('Error interno en /move:', error);
        }
        // Error general del servidor
        res.status(500).json({ 
            error: 'Error interno del servidor',
            detalle: error.message 
        });
    }
});

/**
 * Endpoint para verificar el estado de salud del bot.
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Bot de 4 en línea (5x5) funcionando',
        timestamp: new Date().toISOString()
    });
});

/**
 * Manejo de rutas no encontradas (404).
 */
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint no encontrado',
        endpoints_disponibles: [`/move?board=[array]`, '/health']
    });
});

// =================================================================
// 4. INICIO DEL SERVIDOR (Solo para ejecución LOCAL)
// =================================================================

let server;
if (process.env.VERCEL_ENV === undefined) { 
    // Usamos 'VERCEL_ENV' porque es la variable que Vercel establece en sus servidores.
    server = app.listen(PORT, () => {
        const emptyBoard = Array(BOARD_LENGTH).fill(0).toString();
        console.log(`Bot  escuchando en puerto ${PORT}`);
        console.log(`Endpoint: http://localhost:${PORT}/move?board=[${emptyBoard}]`);
    });
}


module.exports = { app, TomarMovimiento, toCoords, toIndex, findOpenThreat, BOT_nuestro, Bot_oponente, BOARD_LENGTH, WIN_COUNT };
