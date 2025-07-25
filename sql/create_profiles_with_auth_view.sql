-- SQL view to expose user emails from auth.users alongside profiles
CREATE OR REPLACE VIEW public.profiles_with_auth AS
SELECT
    p.id,
    p.login,
    -- The profiles table stores the user's full name in a single column.
    -- Expose it as "nombre" to keep compatibility with existing queries.
    p.full_name AS nombre,
    -- No separate last name column exists, return NULL for "apellido".
    NULL::text AS apellido,
    p.telefono,
    p.empresa,
    u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;
