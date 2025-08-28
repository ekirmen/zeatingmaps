# Utilidades de Validación JSON

Este directorio contiene utilidades para prevenir y corregir la corrupción de campos JSON en la base de datos.

## 🚨 Problema Resuelto

**Campo `imagenes` corrupto detectado:**
```json
"imagenes": "{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"b\",\"3\":\"a\",\"4\":\"n\",\"5\":\"n\",\"6\":\"e\",\"7\":\"r\",\"8\":\"\\\"\",\"9\":\":\",\"10\":\"{\",\"11\":\"}\",\"12\":\",\",\"13\":\"\\\"\",\"14\":\"o\",\"15\":\"b\",\"16\":\"r\",\"17\":\"a\",\"18\":\"I\",\"19\":\"m\",\"20\":\"a\",\"21\":\"g\",\"22\":\"e\",\"23\":\"n\",\"24\":\"\\\"\",\"25\":\":\",\"26\":\"{\",\"27\":\"}\",\"28\":\",\",\"29\":\"\\\"\",\"30\":\"p\",\"31\":\"o\",\"32\":\"r\",\"33\":\"t\",\"34\":\"a\",\"35\":\"d\",\"36\":\"a\",\"37\":\"\\\"\",\"38\":\":\",\"39\":\"{\",\"40\":\"}\",\"41\":\",\",\"42\":\"\\\"\",\"43\":\"e\",\"44\":\"s\",\"45\":\"p\",\"46\":\"e\",\"47\":\"c\",\"48\":\"t\",\"49\":\"a\",\"50\":\"c\",\"51\":\"u\",\"52\":\"l\",\"53\":\"o\",\"54\":\"\\\"\",\"55\":\":\",\"56\":\"[\",\"57\":\"{\",\"58\":\"}\",\"59\":\"]\",\"60\":\",\",\"61\":\"\\\"\",\"62\":\"l\",\"63\":\"o\",\"64\":\"g\",\"65\":\"o\",\"66\":\"H\",\"67\":\"o\",\"68\":\"r\",\"69\":\"i\",\"70\":\"z\",\"71\":\"o\",\"72\":\"n\",\"73\":\"t\",\"74\":\"a\",\"75\":\"l\",\"76\":\"\\\"\",\"77\":\":\",\"78\":\"{\",\"79\":\"}\",\"80\":\",\",\"81\":\"\\\"\",\"82\":\"l\",\"83\":\"o\",\"84\":\"g\",\"85\":\"o\",\"86\":\"V\",\"87\":\"e\",\"88\":\"r\",\"89\":\"t\",\"90\":\"i\",\"91\":\"c\",\"92\":\"a\",\"93\":\"l\",\"94\":\"\\\"\",\"95\":\":\",\"96\":\"{\",\"97\":\"}\",\"98\":\",\",\"99\":\"\\\"\",\"100\":\"b\",\"101\":\"a\",\"102\":\"n\",\"103\":\"n\",\"104\":\"e\",\"105\":\"r\",\"106\":\"P\",\"107\":\"u\",\"108\":\"b\",\"109\":\"l\",\"110\":\"i\",\"111\":\"c\",\"112\":\"i\",\"113\":\"d\",\"114\":\"a\",\"115\":\"d\",\"116\":\"\\\"\",\"117\":\":\",\"118\":\"{\",\"119\":\"}\",\"120\":\",\",\"121\":\"\\\"\",\"122\":\"l\",\"123\":\"o\",\"124\":\"g\",\"125\":\"o\",\"126\":\"C\",\"127\":\"u\",\"128\":\"a\",\"129\":\"d\",\"130\":\"r\",\"131\":\"a\",\"132\":\"d\",\"133\":\"o\",\"134\":\"\\\"\",\"135\":\":\",\"136\":\"{\",\"137\":\"}\",\"138\":\",\",\"139\":\"\\\"\",\"140\":\"l\",\"141\":\"o\",\"142\":\"g\",\"143\":\"o\",\"144\":\"P\",\"145\":\"a\",\"146\":\"s\",\"147\":\"s\",\"148\":\"b\",\"149\":\"o\",\"150\":\"o\",\"151\":\"k\",\"152\":\"\\\"\",\"153\":\":\",\"154\":\"{\",\"155\":\"}\",\"156\":\",\",\"157\":\"\\\"\",\"158\":\"p\",\"159\":\"a\",\"160\":\"s\",\"161\":\"s\",\"162\":\"B\",\"163\":\"o\",\"164\":\"o\",\"165\":\"k\",\"166\":\"B\",\"167\":\"a\",\"168\":\"n\",\"169\":\"n\",\"170\":\"e\",\"171\":\"r\",\"172\":\"\\\"\",\"173\":\":\",\"174\":\"{\",\"175\":\"}\",\"176\":\"}\",\"logoHorizontal\":{}}"
```

Este campo contiene **177 propiedades numeradas** (del 0 al 176) que representan caracteres individuales de un JSON malformado.

## 🛠️ Soluciones Implementadas

### 1. **Validación Automática al Cargar**
- Los campos JSON se validan automáticamente cuando se cargan desde la base de datos
- Se detectan campos corruptos y se limpian antes de mostrar en la interfaz

### 2. **Validación Antes de Guardar**
- Todos los campos JSON se validan antes de enviarse a la base de datos
- Se previene la corrupción de datos en el guardado

### 3. **Limpieza Automática**
- Los campos corruptos se reemplazan con valores por defecto válidos
- Se registra en consola cuando se detecta y corrige corrupción

## 📁 Archivos

### `jsonValidation.js`
Contiene todas las funciones de validación y limpieza:

- `validateAndCleanJsonField()` - Valida y limpia un campo JSON individual
- `cleanEventoJsonFields()` - Limpia todos los campos JSON de un evento
- `cleanEventosArray()` - Limpia un array de eventos
- `isJsonFieldValid()` - Verifica si un campo JSON es válido

### `Evento.js` (Actualizado)
- Usa las utilidades de validación en `fetchEventos()`
- Usa las utilidades de validación en `handleEdit()`
- Usa las utilidades de validación en `handleSave()`

## 🔧 Uso

### Validar un campo individual:
```javascript
import { validateAndCleanJsonField } from '../utils/jsonValidation';

const campoLimpio = validateAndCleanJsonField(
  evento.imagenes, 
  'imagenes', 
  {}
);
```

### Limpiar un evento completo:
```javascript
import { cleanEventoJsonFields } from '../utils/jsonValidation';

const eventoLimpio = cleanEventoJsonFields(evento);
```

### Limpiar un array de eventos:
```javascript
import { cleanEventosArray } from '../utils/jsonValidation';

const eventosLimpios = cleanEventosArray(eventos);
```

## 🎯 Campos Protegidos

Los siguientes campos JSON están protegidos contra corrupción:

- `imagenes` → `{}`
- `datosComprador` → `{}`
- `datosBoleto` → `{}`
- `analytics` → `{ enabled: false, gtmId: '' }`
- `otrasOpciones` → `{}`
- `tags` → `[]`

## 🚀 Beneficios

1. **Prevención**: Evita que se guarden campos JSON corruptos
2. **Detección**: Identifica automáticamente campos corruptos al cargar
3. **Limpieza**: Corrige automáticamente campos corruptos
4. **Logging**: Registra todas las operaciones de limpieza
5. **Reutilización**: Funciones centralizadas para toda la aplicación

## ⚠️ Notas Importantes

- **Siempre** use las funciones de validación antes de guardar datos
- **Siempre** use las funciones de limpieza al cargar datos
- Los campos corruptos se reemplazan con valores por defecto
- Se recomienda revisar los logs de consola para detectar corrupción
