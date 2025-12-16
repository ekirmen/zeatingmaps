import React from 'react';

const normalizeString = (value) => {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  if (value == null) {
    return '';
  }
  try {
    return String(value).toLowerCase();
  } catch (error) {
    return '';
  }
};

export const AUTH_ERROR_DETAILS = {
  account_not_found: {
    defaultMessage: 'No encontramos una cuenta registrada con este correo.',
    i18nKey: 'login.account_not_found',
    type: 'error',
  },
  invalid_password: {
    defaultMessage: 'La contraseña ingresada es incorrecta.',
    i18nKey: 'login.invalid_password',
    type: 'error',
  },
  email_not_confirmed: {
    defaultMessage: 'Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada.',
    i18nKey: 'login.email_not_confirmed',
    type: 'info',
  },
  rate_limited: {
    defaultMessage: 'Has realizado demasiados intentos. Inténtalo nuevamente en unos minutos.',
    i18nKey: 'login.rate_limited',
    type: 'warning',
  },
  account_disabled: {
    defaultMessage: 'Tu cuenta ha sido bloqueada temporalmente. Contacta al equipo de soporte.',
    i18nKey: 'login.account_disabled',
    type: 'error',
  },
  password_required: {
    defaultMessage: 'Debes ingresar tu contraseña para continuar.',
    i18nKey: 'login.password_required',
    type: 'error',
  },
  session_expired: {
    defaultMessage: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
    i18nKey: 'login.session_expired',
    type: 'info',
  },
  mfa_required: {
    defaultMessage: 'Se requiere un segundo factor de autenticación para continuar.',
    i18nKey: 'login.mfa_required',
    type: 'info',
  },
  network: {
    defaultMessage: 'No pudimos conectarnos con el servidor. Verifica tu conexión e inténtalo otra vez.',
    i18nKey: 'login.network_error',
    type: 'error',
  },
  unknown: {
    defaultMessage: 'No se pudo iniciar sesión. Verifica tus datos e inténtalo nuevamente.',
    i18nKey: 'login.generic_error',
    type: 'error',
  },
};

const SAFE_ERROR_CODES = new Set(Object.keys(AUTH_ERROR_DETAILS));

const checkProfileExists = async (supabaseClient, email) => {
  if (!supabaseClient || !email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  try {
    const { data: loginMatch, error: loginError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('login', normalizedEmail)
      .maybeSingle();

    if (loginError && loginError.code !== 'PGRST116') {
      throw loginError;
    }

    if (loginMatch) {
      return true;
    }

    const { data: emailMatch, error: emailError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (emailError && emailError.code !== 'PGRST116') {
      throw emailError;
    }

    return !!emailMatch;
  } catch (lookupError) {
    return null;
  }
};

export const normalizeAuthError = async (error, supabaseClient, email) => {
  if (!error) return null;

  const normalizedMessage = normalizeString(error.message);
  const normalizedCode = normalizeString(error.code);
  const statusCode = error.status || error.statusCode || error.status_code;

  let code = 'unknown';

  if (normalizedCode && SAFE_ERROR_CODES.has(normalizedCode)) {
    code = normalizedCode;
  } else if (normalizedCode === 'invalid_grant' || normalizedMessage.includes('invalid login credentials')) {
    code = 'invalid_credentials';
  } else if (normalizedCode === 'user_not_found' || normalizedMessage.includes('user not found')) {
    code = 'account_not_found';
  } else if (normalizedCode === 'email_not_confirmed' || normalizedMessage.includes('email not confirmed') || normalizedMessage.includes('confirm your email')) {
    code = 'email_not_confirmed';
  } else if (normalizedCode === 'session_not_found' || normalizedMessage.includes('refresh token') || normalizedMessage.includes('session not found')) {
    code = 'session_expired';
  } else if (normalizedCode === 'mfa_required') {
    code = 'mfa_required';
  } else if (normalizedMessage.includes('password required') || normalizedMessage.includes('password is required')) {
    code = 'password_required';
  } else if (normalizedMessage.includes('password') && normalizedMessage.includes('incorrect')) {
    code = 'invalid_password';
  } else if (normalizedMessage.includes('invalid email')) {
    code = 'account_not_found';
  } else if (normalizedMessage.includes('too many') || normalizedMessage.includes('rate limit') || normalizedMessage.includes('too_many_requests') || statusCode === 429) {
    code = 'rate_limited';
  } else if (normalizedMessage.includes('not allowed') || normalizedMessage.includes('blocked') || normalizedMessage.includes('disabled')) {
    code = 'account_disabled';
  } else if (normalizedMessage.includes('fetch') || normalizedMessage.includes('network') || normalizedMessage.includes('failed to fetch')) {
    code = 'network';
  } else if (normalizedMessage.includes('credential') || normalizedMessage.includes('contraseña') || normalizedMessage.includes('password')) {
    code = 'invalid_credentials';
  }

  if (code === 'invalid_credentials') {
    const exists = await checkProfileExists(supabaseClient, email);
    if (exists === false) {
      code = 'account_not_found';
    } else if (exists === true) {
      code = 'invalid_password';
    } else {
      // If we cannot verify, prefer to guide the user to register instead of blaming the password
      code = 'account_not_found';
    }
  }

  const details = AUTH_ERROR_DETAILS[code] || AUTH_ERROR_DETAILS.unknown;

  return {
    code,
    message: details.defaultMessage,
    i18nKey: details.i18nKey,
    type: details.type,
    originalMessage: error.message,
  };
};

export const createAuthError = (info, error) => {
  const authError = new Error(info.message);
  authError.code = info.code;
  authError.i18nKey = info.i18nKey;
  authError.type = info.type;
  authError.originalError = error;
  authError.originalMessage = info.originalMessage;
  return authError;
};

export const getAuthErrorMessage = (error, translateFn) => {
  const details = AUTH_ERROR_DETAILS[error?.code];
  const i18nKey = error?.i18nKey || details?.i18nKey || 'login.generic_error';
  const fallbackMessage = error?.message || details?.defaultMessage || AUTH_ERROR_DETAILS.unknown.defaultMessage;

  if (typeof translateFn === 'function') {
    return translateFn(i18nKey, fallbackMessage);
  }

  return fallbackMessage;
};

export default {
  AUTH_ERROR_DETAILS,
  normalizeAuthError,
  createAuthError,
  getAuthErrorMessage
};