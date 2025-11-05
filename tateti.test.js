// Importamos la app, que ahora contiene todas las funciones unitarias adjuntas.
const app = require('./tateti'); // Usamos 'server' para reflejar el nombre del archivo principal

// Desestructuramos las funciones y constantes que están adjuntas a 'app'.
const {
    findOpenThreat,
    TomarMovimiento,
    BOT_nuestro,
    Bot_oponente,
    BOARD_LENGTH,
    WIN_COUNT,
    CENTER_POSITION,
    isWinningMove, // Agregado para testear lógica interna si es necesario
    findWinningOrBlockingMove // Agregado para testear lógica interna
} = app; 

// --- CONSTANTES DEL JUEGO 5x5 (4 en línea) ---
const EMPTY_BOARD = Array(BOARD_LENGTH).fill(0);

// Tests para la función findOpenThreat (4 en línea)
describe('Función findOpenThreat (5x5, 4 en línea) - Placeholder', () => {

    test('debería retornar -1 o null cuando se busca WIN_COUNT - 1 (3 en línea)', () => {
        // NOTA: findOpenThreat es una función genérica. Nuestra implementación solo busca 4 en línea (victoria).
        // Por lo tanto, para 3 en línea (WIN_COUNT - 1), devolvemos null o -1, ya que no es una victoria inmediata.
        const board = [...EMPTY_BOARD];
        board[0] = BOT_nuestro;
        board[1] = BOT_nuestro;
        board[2] = BOT_nuestro; // 3 en línea (0, 1, 2)
        
        const resultado = findOpenThreat(board, BOT_nuestro, WIN_COUNT - 1); 
        // El resultado debe ser null porque la lógica de 'findOpenThreat' para 3 en línea no está implementada
        expect(resultado).toBeNull(); 
    });

    test('debería retornar null si el tablero está vacío', () => {
        const board = [...EMPTY_BOARD];
        const resultado = findOpenThreat(board, BOT_nuestro, WIN_COUNT - 1);
        expect(resultado).toBeNull();
    });
});

// Tests para la función TomarMovimiento (Estrategia: Ganar > Bloquear > Centro > Esquina > Fallback)
describe('Función TomarMovimiento (Estrategia 5x5 Inteligente)', () => {
    
    // --- Prioridad 1: Ganar Inmediatamente (4 en línea) ---
    test('Prioridad 1: Debe encontrar un movimiento ganador (3 en línea propia + 1 vacío)', () => {
        // Escenario Horizontal: [1, 1, 1, 0, ...] -> Posición 3 es ganadora
        const board = [...EMPTY_BOARD];
        board[0] = BOT_nuestro;
        board[1] = BOT_nuestro;
        board[2] = BOT_nuestro; 
        
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(3); // ¡Gana en 3!
    });
    
    // --- Prioridad 2: Bloquear una Victoria Inminente ---
    test('Prioridad 2: Debe bloquear una victoria inminente del oponente (Oponente 3 en línea + 1 vacío)', () => {
        // Escenario Vertical: [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...]
        // Oponente tiene: 0, 5, 10. Le falta el 15 para ganar (vertical).
        const board = [...EMPTY_BOARD];
        board[0] = Bot_oponente;
        board[5] = Bot_oponente;
        board[10] = Bot_oponente;
        // Agregamos un movimiento propio para simular un turno, no debe interferir con el bloqueo.
        board[20] = BOT_nuestro;
        
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(15); // Bloquea en 15
    });

    // --- Prioridad 3: Tomar el Centro ---
    test('Prioridad 3: Tomar el centro en tablero casi vacío', () => {
        // El centro (12) es la prioridad si no hay movimientos de ganar/bloquear.
        const board = [...EMPTY_BOARD];
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(CENTER_POSITION); 
    });

    // --- Prioridad 4: Tomar Esquina ---
    test('Prioridad 4: Debe tomar la primera esquina disponible si el centro está ocupado', () => {
        // Tablero: Centro (12) y dos esquinas (0 y 4) ocupadas.
        const board = [...EMPTY_BOARD];
        board[CENTER_POSITION] = Bot_oponente; // Centro ocupado
        board[0] = Bot_oponente; // Esquina superior izquierda ocupada
        board[4] = BOT_nuestro;  // Esquina superior derecha ocupada
        
        // Las esquinas disponibles son 20 y 24. El bot debe elegir la primera: 20 (inferior izquierda).
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(20); 
    });

    // --- Prioridad 5: Fallback (Primer Vacío) ---
    test('Prioridad 5: Debe tomar el primer vacío (5) si centro y esquinas están ocupadas y no hay amenazas', () => {
        // Centro y todas las 4 esquinas ocupadas.
        const board = [...EMPTY_BOARD];
        board[CENTER_POSITION] = Bot_oponente; 
        board[0] = BOT_nuestro; // Esquina 0
        board[4] = Bot_oponente; // Esquina 4
        board[20] = BOT_nuestro; // Esquina 20
        board[24] = Bot_oponente; // Esquina 24
        
        // El primer espacio vacío disponible fuera de esquinas/centro es 1.
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(1);
    });

    test('debería retornar -1 si no hay movimientos disponibles', () => {
        // Tablero completamente lleno
        const fullBoard = Array(BOARD_LENGTH).fill(1);
        const resultado = TomarMovimiento(fullBoard);
        expect(resultado).toBe(-1);
    });
});