-- SQL view to expose user emails from auth.users alongside profiles
CREATE OR REPLACE VIEW public.profiles_with_auth AS
SELECT
    p.id,
    p.login,
    p.nombre,
    p.apellido,
    p.telefono,
    p.empresa,
    u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id;
