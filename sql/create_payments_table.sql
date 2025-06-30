-- SQL schema for the `payments` table.
-- Includes fields for the customer (usuario_id) and the user processing the sale
-- (processed_by). Seats and payments are stored as JSONB arrays.

CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id uuid NOT NULL REFERENCES profiles(id),
    processed_by uuid NULL REFERENCES profiles(id),
    metodo_pago_id integer NOT NULL,
    monto numeric NOT NULL,
    fecha TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    event uuid NULL REFERENCES eventos(id),
    funcion integer NULL REFERENCES funciones(id),
    locator text,
    payments jsonb,
    seats jsonb,
    status text,
    referrer text,
    discountCode text,
    reservationDeadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_metodo_pago FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usuario_id ON payments (usuario_id);
CREATE INDEX IF NOT EXISTS idx_processed_by ON payments (processed_by);
CREATE INDEX IF NOT EXISTS idx_metodo_pago ON payments (metodo_pago_id);
CREATE INDEX IF NOT EXISTS idx_funcion ON payments (funcion);
CREATE INDEX IF NOT EXISTS idx_event ON payments (event);
