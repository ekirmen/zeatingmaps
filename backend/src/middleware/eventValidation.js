import { body, validationResult } from 'express-validator';

const validateEvent = [
  body('nombre')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  
  body('sector')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El sector debe tener entre 3 y 50 caracteres'),
  
  body('recinto')
    .isMongoId()
    .withMessage('El recinto debe ser un ID válido'),
  
  body('sala')
    .isMongoId()
    .withMessage('La sala debe ser un ID válido'),
  
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('Activo debe ser un valor booleano'),
  
  body('oculto')
    .optional()
    .isBoolean()
    .withMessage('Oculto debe ser un valor booleano'),
  
  body('desactivado')
    .optional()
    .isBoolean()
    .withMessage('Desactivado debe ser un valor booleano'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array(),
        message: 'Error de validación en los datos del evento'
      });
    }
    next();
  }
];

export default validateEvent;
