// Manejo de errores de MongoDB
export const handleMongoError = (res, error, contextMessage) => {
  console.error(`[${new Date().toISOString()}] ${contextMessage}:`, error);

  let statusCode = 500;
  let message = 'Error interno del servidor';
  let errors = [];

  // Manejo de errores de validación
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
    errors = Object.values(error.errors).map(err => err.message);
  }

  // Manejo de errores de duplicado
  if (error.code === 11000) {
    statusCode = 409;
    message = 'Conflicto de datos';
    const field = Object.keys(error.keyPattern)[0];
    errors = [`El ${field} ya existe en la base de datos`];
  }

  // Manejo de errores de ObjectId no válido
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    statusCode = 400;
    message = 'ID no válido';
    errors = ['El ID proporcionado no tiene un formato válido'];
  }

  // Respuesta de error
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(errors.length > 0 && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Manejo de errores generales
export const handleError = (res, error, contextMessage) => {
  console.error(`[${new Date().toISOString()}] ${contextMessage}:`, error);
  
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      error: error.message,
      stack: error.stack 
    })
  });
};
