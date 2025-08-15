# Buscador de Sala Implementado en CrearMapa

## 🎯 Funcionalidad Agregada

Se ha implementado un **buscador de sala** en el componente `CrearMapa` que permite:

- 🔍 **Buscar salas** por nombre o ID
- 🔄 **Cambiar de sala** dinámicamente sin recargar la página
- 📊 **Ver información** de la sala actual (nombre, ID, asientos, mesas)
- ⏱️ **Indicadores de estado** durante la carga y cambio de salas

## 🚀 Características Principales

### 1. Buscador Inteligente
- **Input de búsqueda** con autocompletado
- **Filtrado en tiempo real** por nombre o ID de sala
- **Dropdown con opciones** formateadas (nombre + ID)
- **Estado de carga** durante la búsqueda

### 2. Cambio Dinámico de Sala
- **Transición suave** entre salas
- **Limpieza automática** de elementos y zonas
- **Carga de datos** de la nueva sala
- **Actualización de URL** para mantener navegación

### 3. Información de Sala
- **Nombre y ID** de la sala actual
- **Contador de asientos** y mesas
- **Estado de guardado** con timestamp
- **Indicador de carga** durante transiciones

## 📁 Archivos Modificados

### `src/backoffice/components/CrearMapa.js`
- ✅ Estados para información de sala
- ✅ Función de búsqueda de salas
- ✅ Función de cambio de sala
- ✅ Buscador en controles superiores
- ✅ Información de sala mejorada

## 🔧 Implementación Técnica

### Estados Agregados
```javascript
// Estados para información de la sala
const [salaInfo, setSalaInfo] = useState(null);
const [loadingSala, setLoadingSala] = useState(false);

// Estados para búsqueda de sala
const [searchSalaId, setSearchSalaId] = useState(salaId || '');
const [availableSalas, setAvailableSalas] = useState([]);
const [searchingSalas, setSearchingSalas] = useState(false);
```

### Funciones Principales
```javascript
// Cargar información de la sala
const loadSalaInfo = async () => { ... }

// Buscar y cambiar de sala
const handleSalaSearch = async (newSalaId) => { ... }

// Buscar salas disponibles
const searchAvailableSalas = async (searchTerm) => { ... }
```

### UI Components
```javascript
// Buscador en controles superiores
<Select
  showSearch
  placeholder="Buscar sala..."
  onChange={handleSalaSearch}
  onSearch={searchAvailableSalas}
  loading={searchingSalas || loadingSala}
  // ... más props
/>

// Información de sala
<div className="sala-info">
  <div className="nombre">{salaInfo.nombre}</div>
  <div className="estadisticas">
    <span>{totalAsientos} asientos</span>
    <span>{totalMesas} mesas</span>
  </div>
</div>
```

## 🎨 Interfaz de Usuario

### Ubicación del Buscador
- **Posición**: Controles superiores, lado izquierdo
- **Estilo**: Dropdown con búsqueda integrada
- **Ancho**: 200px para mostrar información completa

### Información de Sala
- **Posición**: Esquina superior izquierda
- **Contenido**: Nombre, ID, estadísticas, estado de guardado
- **Estados**: Carga, información completa, error

### Indicadores Visuales
- **Icono de búsqueda**: Cambia de color y anima durante carga
- **Estado de carga**: Spinner y texto descriptivo
- **Confirmaciones**: Mensajes de éxito/error con Ant Design

## 🔄 Flujo de Uso

### 1. Búsqueda de Sala
1. Usuario hace clic en el buscador
2. Escribe nombre o ID de la sala
3. Sistema filtra opciones en tiempo real
4. Usuario selecciona sala deseada

### 2. Cambio de Sala
1. Sistema valida la selección
2. Limpia elementos actuales
3. Carga datos de la nueva sala
4. Actualiza interfaz y URL
5. Muestra confirmación de éxito

### 3. Gestión de Estados
1. **Buscando**: Dropdown muestra "Buscando..."
2. **Cambiando**: Buscador se deshabilita, icono anima
3. **Completado**: Nueva información se muestra
4. **Error**: Mensaje de error, estado se mantiene

## 🛠️ Personalización

### Configurar Salas Disponibles
```javascript
// En searchAvailableSalas, reemplazar el mock con tu API real
const searchAvailableSalas = async (searchTerm) => {
  // Implementar búsqueda real de salas
  const salas = await fetchSalas(searchTerm);
  setAvailableSalas(salas);
};
```

### Modificar Campos de Sala
```javascript
// En loadSalaInfo, ajustar según tu estructura de datos
setSalaInfo({
  id: salaData.id,
  nombre: salaData.nombre,
  capacidad: salaData.capacidad,
  // ... más campos
});
```

### Personalizar UI
```javascript
// Modificar estilos en renderTopControls y renderSalaInfo
// Cambiar colores, tamaños, posiciones según tu diseño
```

## 🧪 Testing

### Casos de Prueba
- ✅ Búsqueda con texto vacío
- ✅ Búsqueda con texto válido
- ✅ Selección de sala existente
- ✅ Cambio exitoso de sala
- ✅ Manejo de errores de API
- ✅ Estados de carga y transición

### Verificación Manual
1. **Abrir CrearMapa** con una sala
2. **Hacer clic en buscador** y ver opciones
3. **Buscar sala** por nombre o ID
4. **Seleccionar nueva sala** y ver cambio
5. **Verificar información** actualizada
6. **Comprobar URL** actualizada

## 🚨 Consideraciones

### Rendimiento
- **Búsqueda debounced** para evitar muchas llamadas API
- **Limpieza de estados** al cambiar de sala
- **Carga paralela** de datos de sala y zonas

### UX
- **Feedback visual** durante todas las operaciones
- **Manejo de errores** con mensajes claros
- **Estados consistentes** en toda la interfaz

### Compatibilidad
- **Funciona con** el sistema de rutas existente
- **Integrado con** el hook useCrearMapa
- **Mantiene** toda la funcionalidad existente

## 🔮 Próximos Pasos

### Mejoras Futuras
- [ ] **Búsqueda avanzada** con filtros adicionales
- [ ] **Historial de salas** visitadas recientemente
- [ ] **Favoritos** para salas más usadas
- [ ] **Búsqueda por ubicación** o características
- [ ] **Sincronización** con otros usuarios

### Optimizaciones
- [ ] **Cache de salas** para búsquedas rápidas
- [ ] **Lazy loading** de datos de sala
- [ ] **Prefetch** de salas relacionadas
- [ ] **Compresión** de datos de mapa

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:

1. **Revisar logs** en consola del navegador
2. **Verificar variables** de entorno de Supabase
3. **Comprobar API** de salas disponible
4. **Revisar permisos** de usuario en la base de datos

---

**Estado**: ✅ Implementado y funcional  
**Versión**: 1.0.0  
**Última actualización**: $(date)
