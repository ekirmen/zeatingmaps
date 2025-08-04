-- Script para corregir automáticamente las funciones 10 y 11
-- Este script creará los datos faltantes necesarios

-- 1. Crear evento de prueba si no existe
INSERT INTO eventos (id, nombre, slug, descripcion, fecha_inicio, fecha_fin, estado, created_at, updated_at)
SELECT 1, 'Evento de Prueba', 'evento-prueba', 'Evento de prueba para funciones 10 y 11', 
       '2025-01-01', '2025-12-31', 'activo', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE id = 1);

-- 2. Crear recinto de prueba si no existe
INSERT INTO recintos (id, nombre, direccion, ciudad, estado, created_at, updated_at)
SELECT 1, 'Recinto de Prueba', 'Dirección de Prueba', 'Caracas', 'activo', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM recintos WHERE id = 1);

-- 3. Crear sala de prueba si no existe
INSERT INTO salas (id, nombre, recinto_id, capacidad, estado, created_at, updated_at)
SELECT 1, 'Sala Principal', 1, 100, 'activo', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM salas WHERE id = 1);

-- 4. Crear plantilla de precios de prueba si no existe
INSERT INTO plantillas (id, nombre, descripcion, detalles, created_at, updated_at)
SELECT 1, 'Plantilla Básica', 'Plantilla de precios básica', 
       '[{"zonaId": 1, "precio": 10.00, "nombre": "General"}]'::jsonb,
       NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM plantillas WHERE id = 1);

-- 5. Crear zona de prueba si no existe
INSERT INTO zonas (id, nombre, sala_id, capacidad, estado, created_at, updated_at)
SELECT 1, 'General', 1, 100, 'activo', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM zonas WHERE id = 1);

-- 6. Crear mapa de prueba si no existe
INSERT INTO mapas (sala_id, contenido, created_at, updated_at)
SELECT 1, 
    '[
        {
            "_id": "mesa_1",
            "type": "mesa",
            "zona": 1,
            "shape": "circle",
            "width": 120,
            "height": 120,
            "nombre": "Mesa 1",
            "radius": 60,
            "sillas": [
                {
                    "_id": "silla_1",
                    "fila": null,
                    "type": "silla",
                    "zona": 1,
                    "price": null,
                    "width": 20,
                    "height": 20,
                    "nombre": 1,
                    "numero": 1,
                    "status": "available",
                    "mesa_id": "mesa_1",
                    "user_id": null,
                    "parentId": "mesa_1",
                    "posicion": {"x": 50, "y": 50},
                    "bloqueado": false
                },
                {
                    "_id": "silla_2",
                    "fila": null,
                    "type": "silla",
                    "zona": 1,
                    "price": null,
                    "width": 20,
                    "height": 20,
                    "nombre": 2,
                    "numero": 2,
                    "status": "available",
                    "mesa_id": "mesa_1",
                    "user_id": null,
                    "parentId": "mesa_1",
                    "posicion": {"x": 80, "y": 50},
                    "bloqueado": false
                }
            ],
            "posicion": {"x": 100, "y": 100}
        },
        {
            "_id": "mesa_2",
            "type": "mesa",
            "zona": 1,
            "shape": "rect",
            "width": 100,
            "height": 80,
            "nombre": "Mesa 2",
            "sillas": [
                {
                    "_id": "silla_3",
                    "fila": null,
                    "type": "silla",
                    "zona": 1,
                    "price": null,
                    "width": 20,
                    "height": 20,
                    "nombre": 1,
                    "numero": 1,
                    "status": "available",
                    "mesa_id": "mesa_2",
                    "user_id": null,
                    "parentId": "mesa_2",
                    "posicion": {"x": 50, "y": 50},
                    "bloqueado": false
                }
            ],
            "posicion": {"x": 300, "y": 100}
        }
    ]'::jsonb,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM mapas WHERE sala_id = 1);

-- 7. Crear función 10 si no existe
INSERT INTO funciones (id, fecha_celebracion, evento, sala, plantilla, created_at, updated_at)
SELECT 10, '2025-01-15 20:00:00', 1, 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funciones WHERE id = 10);

-- 8. Crear función 11 si no existe
INSERT INTO funciones (id, fecha_celebracion, evento, sala, plantilla, created_at, updated_at)
SELECT 11, '2025-01-16 20:00:00', 1, 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM funciones WHERE id = 11);

-- 9. Verificar que todo se creó correctamente
SELECT 'Verificación final:' as info;

SELECT 'Funciones creadas:' as tipo, COUNT(*) as cantidad
FROM funciones WHERE id IN (10, 11)
UNION ALL
SELECT 'Eventos:', COUNT(*) FROM eventos WHERE id = 1
UNION ALL
SELECT 'Salas:', COUNT(*) FROM salas WHERE id = 1
UNION ALL
SELECT 'Mapas:', COUNT(*) FROM mapas WHERE sala_id = 1
UNION ALL
SELECT 'Zonas:', COUNT(*) FROM zonas WHERE sala_id = 1
UNION ALL
SELECT 'Plantillas:', COUNT(*) FROM plantillas WHERE id = 1; 