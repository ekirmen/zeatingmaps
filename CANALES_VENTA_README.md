# Sistema de Canales de Venta

Este sistema permite controlar qué canales de venta están habilitados para mostrar precios y permitir compras, manteniendo las funciones activas pero controlando la visibilidad de precios por canal.

## 🎯 **Concepto Principal**

- **Función activa**: La función del evento permanece activa
- **Control de precios**: Los precios se muestran/ocultan según el canal
- **Control de compras**: Los botones de compra se habilitan/deshabilitan según el canal
- **Flexibilidad**: Puedes vender en boletería pero no en store, o viceversa

## 🏗️ **Estructura de la Base de Datos**

```sql
create table public.canales_venta (
  id serial not null,
  nombre character varying(255) not null,
  url character varying(500) not null,
  activo boolean null default true,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  tenant_id uuid null,
  constraint canales_venta_pkey primary key (id),
  constraint canales_venta_tenant_id_fkey foreign KEY (tenant_id) references tenants (id) on delete CASCADE
);
```

## 📋 **Canales Configurados**

| ID | Nombre | URL | Estado |
|----|--------|-----|--------|
| 2 | Internet | https://sistema.veneventos.com/store/ | ✅ Activo |
| 3 | Test | https://sistema.veneventos.com/test/ | ✅ Activo |
| 4 | Backoffice | https://sistema.veneventos.com/dashboard/boleteria | ✅ Activo |

## 🚀 **Cómo Implementar**

### 1. **Envolver la aplicación con el Provider**

```jsx
// En App.jsx o el componente raíz
import { CanalVentaProvider } from './contexts/CanalVentaContext';

function App() {
  return (
    <CanalVentaProvider>
      {/* Resto de tu aplicación */}
    </CanalVentaProvider>
  );
}
```

### 2. **Usar el hook en componentes**

```jsx
import { useCanalVenta } from '../contexts/CanalVentaContext';

function MiComponente() {
  const { canalActual, ventasHabilitadas, esStore, esBackoffice } = useCanalVenta();

  return (
    <div>
      <p>Canal actual: {canalActual?.nombre}</p>
      <p>Ventas habilitadas: {ventasHabilitadas() ? 'Sí' : 'No'}</p>
      {esStore && <p>Estás en el store</p>}
      {esBackoffice && <p>Estás en el backoffice</p>}
    </div>
  );
}
```

### 3. **Controlar precios con componentes predefinidos**

```jsx
import { PrecioEvento, BotonCompraControlado } from './PrecioControlado';

function ListaPrecios() {
  const { canalActual } = useCanalVenta();

  return (
    <div>
      <h3>Precios del Evento</h3>
      
      {/* Precio que se oculta si el canal no está activo */}
      <PrecioEvento 
        precio={25.99} 
        canalId={canalActual?.id}
        moneda="$"
      />
      
      {/* Botón que se deshabilita si el canal no está activo */}
      <BotonCompraControlado
        canalId={canalActual?.id}
        onClick={() => console.log('Comprar')}
        className="btn-comprar"
      >
        Comprar Entrada
      </BotonCompraControlado>
    </div>
  );
}
```

### 4. **Usar la plantilla completa de precios**

```jsx
import PlantillaPreciosControlada from './PlantillaPreciosControlada';

function EventoPage() {
  const evento = { nombre: "Concierto de Rock" };
  const precios = [
    { nombre: "General", valor: 25.99, descripcion: "Entrada general" },
    { nombre: "VIP", valor: 49.99, descripcion: "Entrada VIP con beneficios" }
  ];

  return (
    <PlantillaPreciosControlada 
      evento={evento} 
      precios={precios} 
    />
  );
}
```

## 🔧 **Funcionalidades del Sistema**

### **Detección Automática de Canal**
- Detecta automáticamente el canal basado en la URL actual
- Funciona con navegación SPA (Single Page Application)
- Escucha cambios de URL en tiempo real

### **Control de Precios**
- Los precios se muestran solo si el canal está activo
- Mensajes personalizables cuando los precios no están disponibles
- Placeholders de carga mientras se detecta el canal

### **Control de Botones de Compra**
- Los botones se deshabilitan automáticamente si el canal no está activo
- Mensajes personalizables para botones deshabilitados
- Estados de carga y error manejados automáticamente

### **Validación por Tenant**
- Cada usuario solo ve canales de su tenant
- Seguridad a nivel de base de datos
- Filtrado automático por `tenant_id`

## 📱 **Casos de Uso**

### **Escenario 1: Venta solo en Boletería**
```jsx
// En el store (/store/eventos)
<PrecioEvento 
  precio={25.99} 
  canalId={2} // ID del canal "Internet"
  mostrarMensaje={true}
/>
// Resultado: "Precio no disponible" porque el canal 2 no está activo
```

### **Escenario 2: Venta solo en Store**
```jsx
// En el backoffice (/dashboard/boleteria)
<PrecioEvento 
  precio={25.99} 
  canalId={4} // ID del canal "Backoffice"
  mostrarMensaje={false}
/>
// Resultado: No se muestra nada porque el canal 4 no está activo
```

### **Escenario 3: Venta en ambos canales**
```jsx
// En cualquier canal
<PrecioEvento 
  precio={25.99} 
  canalId={canalActual?.id}
/>
// Resultado: "$25.99" si el canal está activo, "Precio no disponible" si no
```

## 🎨 **Personalización**

### **Mensajes Personalizados**
```jsx
<PrecioEvento 
  precio={25.99} 
  canalId={canalActual?.id}
  mensajeDeshabilitado="Precio reservado para venta telefónica"
/>
```

### **Contenido Alternativo**
```jsx
<PrecioControlado 
  canalId={canalActual?.id}
  fallback={<span className="text-blue-600">Contactar para precio</span>}
>
  <span className="text-green-600">$25.99</span>
</PrecioControlado>
```

### **Estilos Personalizados**
```jsx
<PrecioEvento 
  precio={25.99} 
  canalId={canalActual?.id}
  className="text-2xl font-bold text-purple-600"
/>
```

## 🔍 **Debugging y Logs**

El sistema incluye logs detallados para debugging:

```javascript
// En la consola verás:
🔍 [CanalVentaContext] Detectando canal para URL: https://sistema.veneventos.com/store/eventos
🔍 [CanalVentaContext] Canal detectado: {id: 2, nombre: "Internet", activo: true}
🔍 [canalVentaService] Obteniendo canales para tenant: 9dbdb86f-8424-484c-bb76-0d9fa27573c8
```

## 🚨 **Consideraciones Importantes**

1. **Siempre envolver con CanalVentaProvider** antes de usar los hooks
2. **Verificar que el tenant_id** esté configurado en el perfil del usuario
3. **Los canales deben tener URLs únicas** para evitar conflictos
4. **El sistema detecta automáticamente** el canal basado en la URL actual

## 📚 **Componentes Disponibles**

- `PrecioControlado`: Controla cualquier contenido basado en canal
- `PrecioEvento`: Específico para mostrar precios de eventos
- `BotonCompraControlado`: Controla botones de compra
- `PlantillaPreciosControlada`: Plantilla completa con todos los controles
- `InfoCanal`: Muestra información del canal actual

## 🎉 **Beneficios del Sistema**

✅ **Control granular** de ventas por canal  
✅ **Flexibilidad** para mantener funciones activas  
✅ **Seguridad** a nivel de tenant  
✅ **Detección automática** de canales  
✅ **Componentes reutilizables** y personalizables  
✅ **Logs detallados** para debugging  
✅ **Validación automática** de permisos  

¿Necesitas ayuda para implementar alguna funcionalidad específica?
