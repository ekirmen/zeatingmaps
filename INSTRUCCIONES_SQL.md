# 📋 **INSTRUCCIONES PARA EJECUTAR SQL EN SUPABASE**

## 🎯 **PASOS PARA CREAR LAS TABLAS:**

### **1. Ir al Panel de Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu cuenta
3. Selecciona tu proyecto

### **2. Abrir el SQL Editor**
1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"**

### **3. Copiar y Pegar el SQL**
Copia todo el contenido del archivo `database_schema_updates.sql` y pégalo en el editor.

### **4. Ejecutar el Script**
1. Haz clic en el botón **"Run"** (▶️)
2. Espera a que se complete la ejecución
3. Verifica que no hay errores

## 🔍 **VERIFICACIÓN:**

### **Verificar que las tablas se crearon:**
1. Ve a **"Table Editor"** en el menú lateral
2. Deberías ver las siguientes tablas nuevas:
   - `custom_forms`
   - `form_responses`
   - `mailchimp_configs`
   - `mailchimp_subscriptions`
   - `push_notifications_config`
   - `push_notifications`

### **Verificar las políticas RLS:**
1. Ve a **"Authentication"** → **"Policies"**
2. Verifica que las políticas se crearon correctamente

## ⚠️ **SI HAY ERRORES:**

### **Error de tipos de datos:**
- Asegúrate de que la tabla `eventos` usa `UUID` para el campo `id`
- Asegúrate de que la tabla `usuarios` usa `UUID` para el campo `id`

### **Error de políticas RLS:**
- Si hay errores con las políticas, puedes ejecutar solo la parte de creación de tablas primero
- Luego ejecutar las políticas por separado

## 🚀 **DESPUÉS DE EJECUTAR EL SQL:**

1. **Reinicia tu aplicación** para que reconozca las nuevas tablas
2. **Prueba las funcionalidades** en la boletería:
   - Formularios personalizados
   - Integración MailChimp
   - Notificaciones push

## 📞 **SI NECESITAS AYUDA:**

Si encuentras algún error, comparte el mensaje de error exacto y te ayudo a resolverlo.

---

**¡Una vez ejecutado el SQL, tendrás acceso a todas las nuevas funcionalidades! 🎉**
