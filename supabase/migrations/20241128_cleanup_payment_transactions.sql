-- Normalize canonical fields before dropping legacy duplicates
UPDATE public.payment_transactions pt
SET
  user_id = COALESCE(pt.user_id, pt.usuario_id, pt."user"),
  amount = COALESCE(pt.amount, pt.monto),
  evento_id = COALESCE(pt.evento_id, pt.event),
  funcion_id = COALESCE(pt.funcion_id, pt.funcion),
  created_at = COALESCE(pt.created_at, pt.fecha, NOW())
WHERE
  pt.user_id IS NULL
  OR pt.amount IS NULL
  OR pt.evento_id IS NULL
  OR pt.funcion_id IS NULL
  OR pt.created_at IS NULL;

-- Ensure processed_by only contains valid profile references
UPDATE public.payment_transactions pt
SET processed_by = NULL
WHERE processed_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = pt.processed_by
  );

-- Add foreign key to link processed_by with profiles
ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_processed_by_fkey
  FOREIGN KEY (processed_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Drop legacy/duplicate columns now that data is normalized
ALTER TABLE public.payment_transactions
  DROP COLUMN IF EXISTS usuario_id,
  DROP COLUMN IF EXISTS "user",
  DROP COLUMN IF EXISTS event,
  DROP COLUMN IF EXISTS funcion,
  DROP COLUMN IF EXISTS monto,
  DROP COLUMN IF EXISTS fecha;
