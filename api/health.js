module.exports = (req, res) => {
  res.json({
    status: 'OK',
    message: 'Bot de 4 en línea (5x5) funcionando en Vercel',
    timestamp: new Date().toISOString()
  });
};
