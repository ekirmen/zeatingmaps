-- Crear buckets de almacenamiento para productos y avatares
-- Nota: Este script debe ejecutarse en la consola de Supabase Storage

-- Bucket para productos
-- INSERT INTO storage.buckets (id, name, public) VALUES ('productos', 'productos', true);

-- Bucket para avatares de usuarios
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Políticas para bucket productos
-- CREATE POLICY "Productos públicos" ON storage.objects FOR SELECT USING (bucket_id = 'productos');
-- CREATE POLICY "Subir productos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'productos');
-- CREATE POLICY "Actualizar productos" ON storage.objects FOR UPDATE USING (bucket_id = 'productos');
-- CREATE POLICY "Eliminar productos" ON storage.objects FOR DELETE USING (bucket_id = 'productos');

-- Políticas para bucket avatars
-- CREATE POLICY "Avatars públicos" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Subir avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
-- CREATE POLICY "Actualizar avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
-- CREATE POLICY "Eliminar avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

-- Instrucciones para crear los buckets manualmente:
-- 1. Ve a tu proyecto de Supabase
-- 2. Ve a Storage en el menú lateral
-- 3. Haz clic en "New bucket"
-- 4. Crea un bucket llamado "productos" y marca como público
-- 5. Crea otro bucket llamado "avatars" y marca como público
-- 6. En cada bucket, ve a Policies y agrega las políticas necesarias 