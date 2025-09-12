# 🔒 GUÍA DE SEGURIDAD - MANEJO DE URLS

## ❌ **PROBLEMA IDENTIFICADO:**
```
https://sistema.veneventos.com/store?email=admin10%40admin.com&password=admin10
```

## 🚨 **RIESGOS DE SEGURIDAD:**

### **1. EXPOSICIÓN DE CREDENCIALES:**
- **Logs del servidor** - Las URLs se registran en logs
- **Historial del navegador** - Credenciales visibles
- **Referrer headers** - Se envían a sitios externos
- **Cache del navegador** - Almacenamiento persistente
- **Screenshots/Compartir** - Capturas de pantalla accidentales

### **2. VULNERABILIDADES:**
- **Shoulder surfing** - Credenciales visibles en pantalla
- **Logs de acceso** - Exposición en archivos de log
- **Proxy/Network** - Interceptación en red
- **Browser history** - Acceso no autorizado al dispositivo

## ✅ **SOLUCIONES IMPLEMENTADAS:**

### **1. SECURITY HANDLER:**
```javascript
// src/store/components/SecurityHandler.jsx
- Detecta parámetros sensibles en URL
- Remueve automáticamente credenciales
- Muestra advertencia de seguridad
- Limpia historial del navegador
```

### **2. PARÁMETROS PROTEGIDOS:**
- `email` - Direcciones de correo
- `password` - Contraseñas
- `token` - Tokens de autenticación
- `key` - Claves de API
- `secret` - Secretos de aplicación

### **3. LIMPIEZA AUTOMÁTICA:**
- **URL limpia** - Sin parámetros sensibles
- **Historial limpio** - Sin rastro de credenciales
- **Advertencia visual** - Usuario informado
- **Log de seguridad** - Auditoría del incidente

## 🛡️ **MEJORES PRÁCTICAS:**

### **1. NUNCA USAR:**
```javascript
// ❌ MALO - Credenciales en URL
window.location.href = `/login?email=${email}&password=${password}`;

// ❌ MALO - Tokens en URL
window.location.href = `/dashboard?token=${token}`;
```

### **2. USAR SIEMPRE:**
```javascript
// ✅ BUENO - POST con datos en body
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// ✅ BUENO - LocalStorage/SessionStorage
localStorage.setItem('token', token);
```

### **3. ALTERNATIVAS SEGURAS:**
- **Formularios POST** - Datos en body, no URL
- **LocalStorage** - Almacenamiento local seguro
- **SessionStorage** - Almacenamiento de sesión
- **Cookies HttpOnly** - Solo servidor accesible
- **Headers personalizados** - Datos en headers

## 🔧 **IMPLEMENTACIÓN:**

### **1. INTEGRADO EN STOREAPP:**
```javascript
<SecurityHandler>
  {/* Toda la aplicación protegida */}
</SecurityHandler>
```

### **2. DETECCIÓN AUTOMÁTICA:**
- **Monitoreo continuo** - Cada cambio de ruta
- **Limpieza inmediata** - Sin demora
- **Advertencia visual** - Usuario informado
- **Log de seguridad** - Auditoría completa

### **3. PARÁMETROS PERMITIDOS:**
- `ref` - Referencias de marketing
- `utm_*` - Parámetros de tracking
- `lang` - Idioma
- `theme` - Tema visual
- `debug` - Modo debug (no producción)

## 📊 **MONITOREO:**

### **1. LOGS DE SEGURIDAD:**
```javascript
console.warn('🚨 SECURITY WARNING: Sensitive parameters detected and removed from URL');
```

### **2. MÉTRICAS:**
- **Intentos de acceso** con credenciales en URL
- **Parámetros removidos** por seguridad
- **Advertencias mostradas** a usuarios
- **URLs limpiadas** automáticamente

## 🎯 **RESULTADO:**

### **✅ PROTECCIÓN ACTIVA:**
- **Detección automática** de parámetros sensibles
- **Limpieza inmediata** de credenciales
- **Advertencia visual** al usuario
- **Auditoría completa** de incidentes

### **✅ SEGURIDAD MEJORADA:**
- **Sin credenciales** en logs
- **Sin exposición** en historial
- **Sin rastro** en cache
- **Sin vulnerabilidades** de URL

---

## 📋 **ARCHIVOS MODIFICADOS:**
- `src/store/components/SecurityHandler.jsx` - Componente de seguridad
- `src/store/StoreApp.jsx` - Integración del handler

## ✅ **ESTADO:**
**Sistema de seguridad implementado. Las credenciales en URL ahora se detectan y remueven automáticamente.**
