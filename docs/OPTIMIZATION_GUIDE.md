# Guía de Optimización del Sistema

Esta guía explica cómo usar los hooks y componentes optimizados creados para reducir código duplicado y mejorar el rendimiento en todo el sistema.

## Hooks Reutilizables

### 1. `useTenant` - Obtener tenant_id con cache

**Ubicación:** `src/hooks/useTenant.js`

**Uso:**
```javascript
import { useTenant } from '../../hooks/useTenant';

const MyComponent = () => {
  const { tenantId, loading, error, refresh } = useTenant();
  
  if (loading) return <Spin />;
  if (error) return <Alert message={error} />;
  
  // Usar tenantId...
};
```

**Beneficios:**
- Cache automático de 5 minutos
- Evita múltiples consultas a la base de datos
- Manejo automático de errores

### 2. `useSupabaseQuery` - Queries con filtrado automático por tenant

**Ubicación:** `src/hooks/useSupabaseQuery.js`

**Uso:**
```javascript
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';

const MyComponent = () => {
  // Obtener todas las entradas del tenant
  const { data: entradas, loading, error, refetch } = useSupabaseQuery('entradas', {
    orderBy: 'nombre_entrada',
    ascending: true
  });
  
  // Obtener entradas filtradas por recinto
  const { data: entradasRecinto } = useSupabaseQuery('entradas', {
    filters: { recinto: recintoId },
    orderBy: 'nombre_entrada'
  });
};
```

**Beneficios:**
- Filtrado automático por tenant_id
- Estados de loading/error manejados automáticamente
- Refetch fácil

### 3. `useSupabaseMutation` - Operaciones CRUD con tenant automático

**Ubicación:** `src/hooks/useSupabaseQuery.js`

**Uso:**
```javascript
import { useSupabaseMutation } from '../../hooks/useSupabaseQuery';

const MyComponent = () => {
  const { create, update, remove, loading, error } = useSupabaseMutation('entradas');
  
  const handleCreate = async () => {
    try {
      const result = await create({
        nombre_entrada: 'Nueva entrada',
        precio: 100
        // tenant_id se añade automáticamente
      });
      console.log('Creado:', result);
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  const handleUpdate = async (id) => {
    await update(id, { precio: 150 });
  };
  
  const handleDelete = async (id) => {
    await remove(id);
  };
};
```

**Beneficios:**
- tenant_id añadido automáticamente
- Validación de tenant en operaciones
- Manejo de errores consistente

### 4. `useAsyncOperation` - Manejo genérico de operaciones async

**Ubicación:** `src/hooks/useAsyncOperation.js`

**Uso:**
```javascript
import { useAsyncOperation } from '../../hooks/useAsyncOperation';

const MyComponent = () => {
  const { data, loading, error, execute, reset } = useAsyncOperation(
    async (param1, param2) => {
      // Tu lógica async aquí
      return await someAsyncFunction(param1, param2);
    },
    {
      immediate: false,
      onSuccess: (result) => console.log('Éxito:', result),
      onError: (err) => console.error('Error:', err)
    }
  );
  
  // Ejecutar manualmente
  const handleClick = () => {
    execute('param1', 'param2');
  };
};
```

## Componentes Wrapper

### `PageWrapper` - Manejo de estados loading/error/empty

**Ubicación:** `src/components/PageWrapper.jsx`

**Uso:**
```javascript
import { PageWrapper } from '../../components/PageWrapper';

const MyPage = () => {
  const { data, loading, error } = useSupabaseQuery('eventos');
  
  return (
    <PageWrapper
      loading={loading}
      error={error}
      data={data}
      showEmpty={true}
      emptyMessage="No hay eventos disponibles"
      onRetry={() => refetch()}
    >
      {/* Tu contenido aquí */}
      <div>
        {data?.map(evento => (
          <Card key={evento.id}>{evento.nombre}</Card>
        ))}
      </div>
    </PageWrapper>
  );
};
```

## Patrón de Optimización

### Antes (Código Repetitivo):
```javascript
const MyComponent = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Obtener usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');
        
        // Obtener tenant_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        
        if (!profile?.tenant_id) throw new Error('Sin tenant_id');
        
        // Obtener datos
        const { data, error } = await supabase
          .from('entradas')
          .select('*')
          .eq('tenant_id', profile.tenant_id);
        
        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) return <Spin />;
  if (error) return <Alert message={error} />;
  
  return <div>{/* ... */}</div>;
};
```

### Después (Optimizado):
```javascript
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { PageWrapper } from '../../components/PageWrapper';

const MyComponent = () => {
  const { data, loading, error, refetch } = useSupabaseQuery('entradas', {
    orderBy: 'nombre_entrada'
  });
  
  return (
    <PageWrapper
      loading={loading}
      error={error}
      data={data}
      showEmpty={true}
      onRetry={refetch}
    >
      <div>
        {data?.map(entrada => (
          <Card key={entrada.id}>{entrada.nombre_entrada}</Card>
        ))}
      </div>
    </PageWrapper>
  );
};
```

**Reducción de código:** ~70 líneas → ~15 líneas

## Checklist de Optimización

Para optimizar una página existente:

1. ✅ Reemplazar obtención manual de tenant_id con `useTenant`
2. ✅ Reemplazar queries manuales con `useSupabaseQuery`
3. ✅ Reemplazar operaciones CRUD manuales con `useSupabaseMutation`
4. ✅ Usar `PageWrapper` para manejo de estados
5. ✅ Eliminar código duplicado de manejo de errores
6. ✅ Eliminar estados manuales de loading/error cuando sea posible

## Ejemplos de Optimización

### Páginas Optimizadas:
- ✅ `WebStudio.js` - Usa `useTenant` para obtener tenant_id
- ✅ `apibackoffice.js` - Funciones helper genéricas con cache

### Páginas Pendientes de Optimizar:
- `Dashboard.js` - Usar `useSupabaseQuery` para todas las queries
- `EventosPage.jsx` - Usar hooks optimizados
- `Funciones.js` - Simplificar con `useSupabaseQuery`
- `CRM.js` - Optimizar queries con hooks
- Todas las páginas del store

## Migración Gradual

Puedes migrar las páginas gradualmente:

1. **Fase 1:** Páginas críticas (Dashboard, Eventos, Funciones)
2. **Fase 2:** Páginas de gestión (CRM, Usuarios, Recintos)
3. **Fase 3:** Páginas del store (Eventos, Carrito, Pagos)
4. **Fase 4:** Componentes reutilizables

## Beneficios de la Optimización

1. **Reducción de código:** ~70% menos código duplicado
2. **Mejor rendimiento:** Cache reduce consultas a BD
3. **Mantenibilidad:** Cambios en un solo lugar
4. **Consistencia:** Mismo patrón en todo el sistema
5. **Seguridad:** Validación automática de tenant_id

