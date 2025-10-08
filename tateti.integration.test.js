const request = require('supertest');
// Asegúrate de importar 'app' y BOARD_LENGTH
const { app, BOARD_LENGTH } = require('./tateti'); 

describe('API Endpoints - Tests de Integración (5x5)', () => {
    
    test('GET /move debería retornar movimiento válido para tablero vacío', async () => {
        const emptyBoard = Array(BOARD_LENGTH).fill(0).toString(); // Tablero vacío 5x5
        
        const respuesta = await request(app)
            .get(`/move?board=[${emptyBoard}]`)
            .expect(200);
        
        expect(respuesta.body).toHaveProperty('movimiento');
        expect(typeof respuesta.body.movimiento).toBe('number');
        // CAMBIO: Rango 0 a 24 (BOARD_LENGTH - 1)
        expect(respuesta.body.movimiento).toBeGreaterThanOrEqual(0);
        expect(respuesta.body.movimiento).toBeLessThanOrEqual(BOARD_LENGTH - 1); 
    });

    test('GET /move debería retornar error para tablero de tamaño incorrecto', async () => {
        // Tablero de 3x3 (9 posiciones) - ahora es incorrecto
        const respuesta = await request(app)
            .get('/move?board=[0,0,0,0,0,0,0,0,0]') 
            .expect(400);
        
        // CAMBIO: El mensaje de error debe indicar el tamaño 25
        expect(respuesta.body.error).toContain(`${BOARD_LENGTH} posiciones`); 
    });

    test('GET /move debería retornar error para tablero lleno', async () => {
        // Tablero 5x5 lleno
        const fullBoard = Array(BOARD_LENGTH).fill(1).toString();
        const respuesta = await request(app)
            .get(`/move?board=[${fullBoard}]`)
            .expect(400);
        
        expect(respuesta.body.error).toContain('No hay movimientos');
    });

    test('GET /move debería priorizar el movimiento ganador (5x5)', async () => {
        // Tablero: Jugador 1 tiene 0, 1, 2. Debe ganar en 3.
        const board = Array(BOARD_LENGTH).fill(0);
        board[0] = 1;
        board[1] = 1;
        board[2] = 1;
        
        const respuesta = await request(app)
            .get(`/move?board=[${board.toString()}]`)
            .expect(200);
        
        expect(respuesta.body.movimiento).toBe(3);
    });
    
    // Test que ya existía y se mantiene
    test('GET /health debería retornar estado OK', async () => {
        const respuesta = await request(app)
            .get('/health')
            .expect(200);
        
        expect(respuesta.body.status).toBe('OK');
        // CORRECCIÓN: Usar el mensaje real que devuelve el servidor
        expect(respuesta.body.message).toContain('Bot de 4 en línea (5x5) funcionando'); // <--- CAMBIO AQUÍ
    });

    // Se mantiene la prueba de JSON inválido
    test('GET /move debería retornar error para JSON inválido', async () => {
        const respuesta = await request(app)
            .get('/move?board=invalid')
            .expect(400); 
        
        expect(respuesta.body).toHaveProperty('error');
        expect(respuesta.body.error).toContain('JSON inválido');
    });
});