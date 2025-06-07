export const errorHandler = (err, req, res, next) => {
    // Si el código de estado ya fue establecido y no es 200, úsalo; si no, usa 500
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
    res.status(statusCode);
  
    res.json({
      message: err.message,
      // Mostrar stack trace solo en desarrollo para no filtrar info en producción
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };
  