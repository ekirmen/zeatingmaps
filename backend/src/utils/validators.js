import mongoose from 'mongoose';

// Validar si un string es un ObjectId válido
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validar campos requeridos
export const validateRequiredFields = (fields, requiredFields) => {
  const missingFields = requiredFields.filter(field => !fields[field]);
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// Validar formato de email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar formato de contraseña
export const isValidPassword = (password) => {
  return password.length >= 8;
};

// Validar formato de fecha
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};
