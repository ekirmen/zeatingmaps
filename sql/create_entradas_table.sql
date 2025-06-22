-- SQL schema for the `entradas` table used in the backoffice.
-- Includes `recinto` as a reference to the venue where the ticket applies.

create table if not exists entradas (
    id uuid primary key default uuid_generate_v4(),
    nombre_entrada text,
    producto text,
    precio numeric,
    cantidad integer,
    min integer,
    max integer,
    iva uuid,
    tipo_producto text,
    recinto uuid not null references recintos(id),
    created_at timestamp with time zone default now()
);
