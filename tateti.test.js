const {
    findOpenThreat,
    TomarMovimiento,
    BOT_nuestro,
    Bot_oponente,
    BOARD_LENGTH,
    WIN_COUNT,
    CENTER_POSITION
} = require('./tateti');

const EMPTY_BOARD = Array(BOARD_LENGTH).fill(0);

describe('Función TomarMovimiento (IA 5x5)', () => {
    
    test('debe retornar un movimiento válido para tablero vacío', () => {
        const board = [...EMPTY_BOARD];
        const resultado = TomarMovimiento(board);
        expect(resultado).toBeGreaterThanOrEqual(0);
        expect(resultado).toBeLessThan(BOARD_LENGTH);
    });

    test('debe encontrar movimiento ganador cuando es posible', () => {
        const board = [...EMPTY_BOARD];
        // Crear 3 en línea horizontal
        board[0] = BOT_nuestro;
        board[1] = BOT_nuestro;
        board[2] = BOT_nuestro;
        
        const resultado = TomarMovimiento(board);
        // Debe completar la línea en posición 3
        expect(resultado).toBe(3);
    });

    test('debe bloquear movimiento ganador del oponente', () => {
        const board = [...EMPTY_BOARD];
        // Opontente tiene 3 en línea vertical
        board[0] = Bot_oponente;
        board[5] = Bot_oponente;
        board[10] = Bot_oponente;
        
        const resultado = TomarMovimiento(board);
        // Debe bloquear en posición 15
        expect(resultado).toBe(15);
    });

    test('debe preferir el centro en tablero vacío', () => {
        const board = [...EMPTY_BOARD];
        const resultado = TomarMovimiento(board);
        expect(resultado).toBe(CENTER_POSITION);
    });

    test('debe retornar -1 para tablero lleno', () => {
        const fullBoard = Array(BOARD_LENGTH).fill(1);
        const resultado = TomarMovimiento(fullBoard);
        expect(resultado).toBe(-1);
    });
});