-- Verificar datos de asientos
-- 1. Verificar total de asientos
SELECT COUNT(*) as total_seats FROM seats;

-- 2. Verificar asientos por función
SELECT funcion_id, COUNT(*) as seats_count
FROM seats 
GROUP BY funcion_id 
ORDER BY funcion_id;

-- 3. Verificar asientos específicos para función 10
SELECT _id, funcion_id, zona, status, bloqueado
FROM seats 
WHERE funcion_id = 10
ORDER BY _id;

-- 4. Verificar asientos específicos para función 5
SELECT _id, funcion_id, zona, status, bloqueado
FROM seats 
WHERE funcion_id = 5
ORDER BY _id;

-- 5. Verificar asientos específicos para función 6
SELECT _id, funcion_id, zona, status, bloqueado
FROM seats 
WHERE funcion_id = 6
ORDER BY _id;

-- 6. Verificar asientos específicos para función 11
SELECT _id, funcion_id, zona, status, bloqueado
FROM seats 
WHERE funcion_id = 11
ORDER BY _id;

-- 7. Verificar duplicados
SELECT _id, COUNT(*) as count
FROM seats 
GROUP BY _id 
HAVING COUNT(*) > 1; 