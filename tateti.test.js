const {
    findOpenThreat,
    TomarMovimiento,
    BOT_nuestro,
    Bot_oponente,
    BOARD_LENGTH,
    WIN_COUNT
} = require('./tateti');

// --- CONSTANTES DEL JUEGO 5x5 (4 en línea) ---
const EMPTY_BOARD = Array(BOARD_LENGTH).fill(0);
const CENTER_POSITION = 12; // Posición central de 5x5

// Tests para la función findOpenThreat (4 en línea)
describe('Función findOpenThreat (5x5, 4 en línea)', () => {

    test('debería encontrar movimiento ganador (3 en línea propia + 1 vacío)', () => {
        // [1, 1, 1, 0, 0, ...]
        const board = [...EMPTY_BOARD];
        board[0] = BOT_nuestro;
        board[1] = BOT_nuestro;
        board[2] = BOT_nuestro; // 3 en línea (0, 1, 2)
        
        const resultado = findOpenThreat(board, BOT_nuestro, WIN_COUNT - 1); // Buscamos 3 en línea
        expect(resultado).toBe(3); // Debería jugar en la posición 3
    });

    test('debería encontrar movimiento bloqueador (3 en línea oponente + 1 vacío)', () => {
        // [2, 0, 2, 2, 0, ...] (Bloquear en la posición 1)
        const board = [...EMPTY_BOARD];
        board[0] = Bot_oponente;
        board[2] = Bot_oponente;
        board[3] = Bot_oponente; // Oponente tiene 3 en (0, 2, 3) y el spot 1 libre
        
        const resultado = findOpenThreat(board, Bot_oponente, WIN_COUNT - 1);
        expect(resultado).toBe(1); // Debería jugar en la posición 1
    });

    test('debería encontrar línea diagonal ganadora (3x + 1 vacío)', () => {
        // Diagonal: 0, 6, 12, 18. Nos falta el 18.
        const board = [...EMPTY_BOARD];
        board[0] = BOT_nuestro;
        board[6] = BOT_nuestro;
        board[12] = BOT_nuestro;
        
        const resultado = findOpenThreat(board, BOT_nuestro, WIN_COUNT - 1);
        expect(resultado).toBe(18); // Debería jugar en 18
    });
    
    test('debería retornar null si solo hay 2 en línea + 1 vacío', () => {
        // [1, 1, 0, 0, 0, ...] (No es amenaza inminente en 5x5/4)
        const board = [...EMPTY_BOARD];
        board[0] = BOT_nuestro;
        board[1] = BOT_nuestro;
        
        const resultado = findOpenThreat(board, BOT_nuestro, WIN_COUNT - 1);
        expect(resultado).toBeNull(); 
    });
    
    test('debería retornar null si la amenaza está bloqueada por el oponente', () => {
        // [1, 1, 2, 0, 0, ...]
        const board = [...EMPTY_BOARD];
        board[0] = BOT_nuestro;
        board[1] = BOT_nuestro;
        board[2] = Bot_oponente;
        
        const resultado = findOpenThreat(board, BOT_nuestro, WIN_COUNT - 1);
        expect(resultado).toBeNull();
    });
});

// Tests para la función TomarMovimiento (Estrategia)
describe('Función TomarMovimiento (Estrategia 5x5)', () => {
    
    test('Prioridad 1: Ganar inmediatamente (horizontal)', () => {
        // Tablero: 1, 1, 1, 0, ...
        const board = [...EMPTY_BOARD];
        board[0] = BOT_nuestro;
        board[1] = BOT_nuestro;
        board[2] = BOT_nuestro;
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(3);
    });

    test('Prioridad 2: Bloquear amenaza (vertical)', () => {
        // Tablero: Oponente tiene 4, 9, 14. Debe jugar en 19.
        const board = [...EMPTY_BOARD];
        board[4] = Bot_oponente;
        board[9] = Bot_oponente;
        board[14] = Bot_oponente;
        
        // Simular que el bot no tiene movimiento ganador
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(19);
    });

    test('Prioridad 3: Tomar el centro', () => {
        // Tablero vacío, debería ir al centro (12)
        const board = [...EMPTY_BOARD];
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(CENTER_POSITION);
    });

    test('Prioridad 4: Tomar posición estratégica si el centro está ocupado', () => {
        // Centro (12) ocupado por el oponente
        const board = [...EMPTY_BOARD];
        board[CENTER_POSITION] = Bot_oponente;
        
        const resultado = TomarMovimiento(board);
        // INCLUIR EL VALOR 7
        expect([6, 8, 16, 18, 10, 14, 2, 22, 7]).toContain(resultado);
    });

    test('debería retornar -1 si no hay movimientos disponibles', () => {
        // Tablero completamente lleno
        const fullBoard = Array(BOARD_LENGTH).fill(1);
        const resultado = TomarMovimiento(fullBoard);
        expect(resultado).toBe(-1);
    });
});