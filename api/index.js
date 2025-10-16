// api/index.js
const { app } = require('../tateti');

// Exporta la aplicación Express directamente. 
// Vercel usará esto para manejar todas las rutas definidas en 'app'.
module.exports = app;