const { ganaroBloquear, TomarMovimiento } = require('./tateti');

// Tests para la función ganaroBloquear
describe('Función ganaroBloquear', () => {
    
    test('debería encontrar movimiento ganador en fila', () => {
        const tablero = [1, 1, 0, 0, 0, 0, 0, 0, 0];
        const resultado = ganaroBloquear(tablero, 1);
        expect(resultado).toBe(2);
    });

    test('debería encontrar movimiento bloqueador en columna', () => {
        const tablero = [2, 0, 0, 2, 0, 0, 0, 0, 0];
        const resultado = ganaroBloquear(tablero, 2);
        expect(resultado).toBe(6);
    });

    test('debería retornar null si no hay movimiento ganador/bloqueador', () => {
        // Tablero completamente lleno - sin movimientos posibles
        const tablero = [1, 2, 1, 2, 1, 2, 2, 1, 2];
        const resultado = ganaroBloquear(tablero, 1);
        expect(resultado).toBeNull();
    });

    test('debería encontrar movimiento ganador en diagonal', () => {
        const tablero = [1, 0, 0, 0, 1, 0, 0, 0, 0];
        const resultado = ganaroBloquear(tablero, 1);
        expect(resultado).toBe(8);
    });
});

// Tests para la función principal TomarMovimiento - Estrategias del Bot
describe('Función TomarMovimiento - Estrategias del Bot', () => {
    
    test('debería priorizar movimiento ganador', () => {
        const tablero = [1, 1, 0, 0, 0, 0, 0, 0, 0];
        const movimiento = TomarMovimiento(tablero);
        expect(movimiento).toBe(2);
    });

    test('debería priorizar movimiento bloqueador', () => {
        const tablero = [2, 2, 0, 0, 0, 0, 0, 0, 0];
        const movimiento = TomarMovimiento(tablero);
        expect(movimiento).toBe(2);
    });

    test('debería elegir el centro si está disponible', () => {
        const tablero = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        const resultado = TomarMovimiento(tablero);
        expect(resultado).toBe(4);
    });

    test('debería elegir esquina si centro está ocupado', () => {
        const tablero = [0, 0, 0, 0, 2, 0, 0, 0, 0];
        const resultado = TomarMovimiento(tablero);
        expect([0, 2, 6, 8]).toContain(resultado);
    });

    test('debería hacer movimiento aleatorio si no hay mejores opciones', () => {
        const tablero = [1, 2, 1, 2, 1, 2, 0, 1, 2];
        const resultado = TomarMovimiento(tablero);
        expect(resultado).toBe(6);
    });

    test('debería retornar -1 si no hay movimientos disponibles', () => {
        const tablero = [1, 2, 1, 2, 1, 2, 1, 2, 1];
        const resultado = TomarMovimiento(tablero);
        expect(resultado).toBe(-1);
    });
});

// Tests para casos extremos
describe('Casos extremos y validaciones', () => {
    
    test('debería manejar tablero con solo una posición libre', () => {
        const tablero = [1, 2, 1, 2, 1, 2, 1, 2, 0];
        const resultado = TomarMovimiento(tablero);
        expect(resultado).toBe(8);
    });

    test('debería elegir entre múltiples esquinas disponibles', () => {
        const tablero = [0, 0, 0, 0, 1, 0, 0, 0, 0];
        const resultado = TomarMovimiento(tablero);
        expect([0, 2, 6, 8]).toContain(resultado);
    });

    test('debería detectar múltiples oportunidades de bloqueo', () => {
        const tablero = [2, 2, 0, 0, 2, 0, 0, 0, 0];
        const resultado = TomarMovimiento(tablero);
        expect([2, 6, 7, 8]).toContain(resultado);
    });
});