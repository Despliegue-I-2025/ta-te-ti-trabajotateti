const request = require('supertest');
const { app } = require('./tateti');

describe('API Endpoints - Tests de Integración', () => {
    
    test('GET /move debería retornar movimiento válido para tablero vacío', async () => {
        const respuesta = await request(app)
            .get('/move?board=[0,0,0,0,0,0,0,0,0]')
            .expect(200);
        
        expect(respuesta.body).toHaveProperty('movimiento');
        expect(typeof respuesta.body.movimiento).toBe('number');
        expect(respuesta.body.movimiento).toBeGreaterThanOrEqual(0);
        expect(respuesta.body.movimiento).toBeLessThanOrEqual(8);
    });

    test('GET /move debería manejar tablero con jugadas existentes', async () => {
        const respuesta = await request(app)
            .get('/move?board=[1,0,0,2,0,0,0,0,0]')
            .expect(200);
        
        expect(respuesta.body.movimiento).toBeDefined();
        const tablero = [1, 0, 0, 2, 0, 0, 0, 0, 0];
        expect(tablero[respuesta.body.movimiento]).toBe(0);
    });

    test('GET /move debería retornar error para JSON inválido', async () => {
        const respuesta = await request(app)
            .get('/move?board=invalid')
            .expect(400); // Ahora debería retornar 400
        
        expect(respuesta.body).toHaveProperty('error');
        expect(respuesta.body.error).toContain('JSON inválido');
    });

    test('GET /move debería retornar error para tablero de tamaño incorrecto', async () => {
        const respuesta = await request(app)
            .get('/move?board=[0,0,0]')
            .expect(400);
        
        expect(respuesta.body.error).toContain('9 posiciones');
    });

    test('GET /health debería retornar estado OK', async () => {
        const respuesta = await request(app)
            .get('/health')
            .expect(200);
        
        expect(respuesta.body.status).toBe('OK');
        expect(respuesta.body.message).toContain('funcionando');
    });

    test('GET /move debería retornar error para tablero lleno', async () => {
        const respuesta = await request(app)
            .get('/move?board=[1,2,1,2,1,2,1,2,1]')
            .expect(400);
        
        expect(respuesta.body.error).toContain('No hay movimientos');
    });

    test('GET /move debería funcionar con BOT_nuestro y Bot_oponente', async () => {
        const respuesta = await request(app)
            .get('/move?board=[1,2,0,0,1,0,0,0,2]')
            .expect(200);
        
        expect(respuesta.body.movimiento).toBeDefined();
        expect([2, 3, 5, 6, 7]).toContain(respuesta.body.movimiento);
    });
});